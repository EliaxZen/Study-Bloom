/**
 * Notas e frequência — CRUD com persistência local (localStorage).
 * Médias ponderadas usam os pesos de `settingsStore.gradeWeights`.
 * Linhas espelham `listSubjects()` (sem disciplinas → lista vazia).
 */

import type { GradeEntry, Subject, SubjectColor } from "../types";
import type { GradeWeights } from "../stores/settingsStore";
import { useSettingsStore } from "../stores/settingsStore";
import { listSubjects } from "./subjects";

export type GradeRow = GradeEntry & {
  subjectName: string;
  color: SubjectColor;
};

export type GradeAssessmentSlot = "assessment1" | "assessment2";

export type UpsertAssessmentInput = {
  subjectId: string;
  slot: GradeAssessmentSlot;
  value: number;
};

export type UpdateGradePatch = {
  assessment1?: number | null;
  assessment2?: number | null;
  attendancePercent?: number;
};

const STORAGE_KEY = "study-bloom-grades";

const DEFAULT_WEIGHTS: GradeWeights = { assessment1: 50, assessment2: 50 };

const SEED: GradeRow[] = [
  {
    id: "g1",
    subjectId: "calc-1",
    subjectName: "Cálculo 1",
    color: "pink",
    assessment1: 7.0,
    assessment2: 7.8,
    attendancePercent: 92,
  },
  {
    id: "g2",
    subjectId: "redes",
    subjectName: "Redes de Computadores",
    color: "mint",
    assessment1: 8.5,
    assessment2: 9.0,
    attendancePercent: 88,
  },
  {
    id: "g3",
    subjectId: "algoritmos",
    subjectName: "Algoritmos",
    color: "lavender",
    assessment1: 9.0,
    assessment2: 8.5,
    attendancePercent: 96,
  },
  {
    id: "g4",
    subjectId: "bd",
    subjectName: "Banco de Dados",
    color: "yellow",
    assessment1: 8.2,
    attendancePercent: 85,
  },
  {
    id: "g5",
    subjectId: "es",
    subjectName: "Engenharia de Software",
    color: "blue",
    assessment1: 7.5,
    assessment2: 8.0,
    attendancePercent: 84,
  },
];

function roundGrade(value: number): number {
  return Math.round(value * 10) / 10;
}

/** Normaliza nota lida do storage (não lança). */
function clampGrade(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(10, Math.max(0, roundGrade(value)));
}

/** Valida nota do usuário no CRUD (rejeita fora de 0–10). */
function assertGrade(value: number): number {
  if (!Number.isFinite(value) || value < 0 || value > 10) {
    throw new Error("Informe uma nota válida (0 a 10)");
  }
  return roundGrade(value);
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

function assertPercent(value: number): number {
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new Error("Frequência deve estar entre 0 e 100");
  }
  return Math.round(value);
}

function sanitizeWeight(value: unknown, fallback: number): number {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return fallback;
  return num;
}

/** Lê pesos do settingsStore quando o caller não passa (ex.: dashboard). */
export function resolveGradeWeights(
  weights?: GradeWeights,
): GradeWeights {
  const fromStore =
    typeof weights === "undefined"
      ? useSettingsStore.getState().gradeWeights
      : weights;
  return {
    assessment1: sanitizeWeight(
      fromStore?.assessment1,
      DEFAULT_WEIGHTS.assessment1,
    ),
    assessment2: sanitizeWeight(
      fromStore?.assessment2,
      DEFAULT_WEIGHTS.assessment2,
    ),
  };
}

/** Normaliza par de pesos para somar 100 (edge: um zero, floats, etc.). */
export function normalizeGradeWeights(
  assessment1: number,
  assessment2: number,
): GradeWeights {
  const w1 = sanitizeWeight(assessment1, 0);
  const w2 = sanitizeWeight(assessment2, 0);
  const total = w1 + w2;
  if (total <= 0) {
    throw new Error("A soma dos pesos precisa ser maior que zero");
  }
  const a1Pct = Math.round((w1 / total) * 100);
  return {
    assessment1: a1Pct,
    assessment2: 100 - a1Pct,
  };
}

/** Média ponderada só com avaliações preenchidas (repondera pesos presentes). */
export function computeAverage(
  assessment1: number | undefined | null,
  assessment2: number | undefined | null,
  weights: GradeWeights = DEFAULT_WEIGHTS,
): number | undefined {
  const resolved = resolveGradeWeights(weights);
  const parts: { value: number; weight: number }[] = [];

  if (
    assessment1 !== undefined &&
    assessment1 !== null &&
    Number.isFinite(assessment1)
  ) {
    parts.push({ value: assessment1, weight: Math.max(0, resolved.assessment1) });
  }
  if (
    assessment2 !== undefined &&
    assessment2 !== null &&
    Number.isFinite(assessment2)
  ) {
    parts.push({ value: assessment2, weight: Math.max(0, resolved.assessment2) });
  }

  if (parts.length === 0) return undefined;

  const totalWeight = parts.reduce((sum, part) => sum + part.weight, 0);
  const raw =
    totalWeight <= 0
      ? parts.reduce((sum, part) => sum + part.value, 0) / parts.length
      : parts.reduce((sum, part) => sum + part.value * part.weight, 0) /
        totalWeight;

  if (!Number.isFinite(raw)) return undefined;
  return Math.round(raw * 10) / 10;
}

function withAverage(row: GradeRow, weights: GradeWeights): GradeRow {
  const average = computeAverage(row.assessment1, row.assessment2, weights);
  const next: GradeRow = { ...row };
  if (average === undefined) delete next.average;
  else next.average = average;
  return next;
}

function normalizeRow(raw: GradeRow): GradeRow {
  const assessment1 =
    raw.assessment1 === undefined || raw.assessment1 === null
      ? undefined
      : Number(raw.assessment1);
  const assessment2 =
    raw.assessment2 === undefined || raw.assessment2 === null
      ? undefined
      : Number(raw.assessment2);

  const attendanceRaw = Number(raw.attendancePercent);
  return {
    id: String(raw.id),
    subjectId: String(raw.subjectId),
    subjectName: String(raw.subjectName ?? raw.subjectId),
    color: raw.color,
    attendancePercent: clampPercent(
      Number.isFinite(attendanceRaw) ? attendanceRaw : 100,
    ),
    ...(assessment1 !== undefined && Number.isFinite(assessment1)
      ? { assessment1: clampGrade(assessment1) }
      : {}),
    ...(assessment2 !== undefined && Number.isFinite(assessment2)
      ? { assessment2: clampGrade(assessment2) }
      : {}),
  };
}

function readStore(): GradeRow[] | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GradeRow[];
    if (!Array.isArray(parsed)) return null;
    return parsed.map(normalizeRow);
  } catch {
    return null;
  }
}

function writeStore(rows: GradeRow[]): void {
  if (typeof localStorage === "undefined") return;
  // Nunca persiste `average` — sempre recalcula com os pesos atuais.
  const payload = rows.map((row) => {
    const rest: GradeRow = { ...row };
    delete rest.average;
    return rest;
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `g-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function rowFromSubject(
  subject: Subject,
  prior?: GradeRow,
  seed?: GradeRow,
): GradeRow {
  const base = prior ?? seed;
  return normalizeRow({
    id: base?.id ?? newId(),
    subjectId: subject.id,
    subjectName: subject.name,
    color: subject.color,
    attendancePercent: base?.attendancePercent ?? 100,
    ...(base?.assessment1 !== undefined
      ? { assessment1: base.assessment1 }
      : {}),
    ...(base?.assessment2 !== undefined
      ? { assessment2: base.assessment2 }
      : {}),
  });
}

/**
 * Espelha disciplinas ativas. Sem subjects → [].
 * Cria linhas faltantes; remove órfãs; atualiza nome/cor.
 */
async function syncStoreWithSubjects(): Promise<GradeRow[]> {
  const subjects = await listSubjects();
  if (subjects.length === 0) return [];

  const existing = readStore();
  const bySubject = new Map(
    (existing ?? []).map((row) => [row.subjectId, row]),
  );
  const seedById = new Map(SEED.map((row) => [row.subjectId, row]));

  const next = subjects.map((subject) =>
    rowFromSubject(
      subject,
      bySubject.get(subject.id),
      existing ? undefined : seedById.get(subject.id),
    ),
  );

  const changed =
    !existing ||
    existing.length !== next.length ||
    next.some((row, i) => {
      const prev = existing[i];
      return (
        !prev ||
        prev.subjectId !== row.subjectId ||
        prev.subjectName !== row.subjectName ||
        prev.color !== row.color ||
        prev.attendancePercent !== row.attendancePercent ||
        prev.assessment1 !== row.assessment1 ||
        prev.assessment2 !== row.assessment2
      );
    });

  if (changed) writeStore(next);
  return next;
}

function findIndexOrThrow(items: GradeRow[], subjectId: string): number {
  const idx = items.findIndex((row) => row.subjectId === subjectId);
  if (idx < 0) throw new Error("Disciplina não encontrada nas notas");
  return idx;
}

export async function listGrades(
  weights?: GradeWeights,
): Promise<GradeRow[]> {
  const resolved = resolveGradeWeights(weights);
  const rows = await syncStoreWithSubjects();
  return rows.map((row) => withAverage(row, resolved));
}

export async function getGradeBySubject(
  subjectId: string,
  weights?: GradeWeights,
): Promise<GradeRow | undefined> {
  const resolved = resolveGradeWeights(weights);
  const rows = await syncStoreWithSubjects();
  const row = rows.find((item) => item.subjectId === subjectId);
  return row ? withAverage(row, resolved) : undefined;
}

/** Grava/atualiza uma avaliação (1 ou 2) e recalcula a média. */
export async function upsertAssessment(
  input: UpsertAssessmentInput,
  weights?: GradeWeights,
): Promise<GradeRow> {
  const resolved = resolveGradeWeights(weights);
  const value = assertGrade(input.value);
  const items = await syncStoreWithSubjects();
  const idx = findIndexOrThrow(items, input.subjectId);

  const updated: GradeRow = {
    ...items[idx],
    [input.slot]: value,
  };

  const next = [...items];
  next[idx] = updated;
  writeStore(next);
  return withAverage(updated, resolved);
}

/** Atualiza campos de uma linha de notas (avaliações e/ou frequência). */
export async function updateGrade(
  subjectId: string,
  patch: UpdateGradePatch,
  weights?: GradeWeights,
): Promise<GradeRow> {
  const resolved = resolveGradeWeights(weights);
  const items = await syncStoreWithSubjects();
  const idx = findIndexOrThrow(items, subjectId);

  const updated: GradeRow = { ...items[idx] };

  if (patch.assessment1 !== undefined) {
    if (patch.assessment1 === null) delete updated.assessment1;
    else updated.assessment1 = assertGrade(patch.assessment1);
  }
  if (patch.assessment2 !== undefined) {
    if (patch.assessment2 === null) delete updated.assessment2;
    else updated.assessment2 = assertGrade(patch.assessment2);
  }
  if (patch.attendancePercent !== undefined) {
    updated.attendancePercent = assertPercent(patch.attendancePercent);
  }

  const next = [...items];
  next[idx] = updated;
  writeStore(next);
  return withAverage(updated, resolved);
}

export async function updateAttendance(
  subjectId: string,
  percent: number,
  weights?: GradeWeights,
): Promise<GradeRow> {
  return updateGrade(subjectId, { attendancePercent: percent }, weights);
}

/** Remove Av1 e Av2 (mantém frequência / linha da disciplina). */
export async function clearAssessments(
  subjectId: string,
  weights?: GradeWeights,
): Promise<GradeRow> {
  return updateGrade(
    subjectId,
    { assessment1: null, assessment2: null },
    weights,
  );
}

/** Cria linha de notas para disciplina nova (quando ainda não existe). */
export async function ensureGradeRow(input: {
  subjectId: string;
  subjectName: string;
  color: SubjectColor;
}): Promise<GradeRow> {
  const items = await syncStoreWithSubjects();
  const existing = items.find((row) => row.subjectId === input.subjectId);
  if (existing) return existing;

  // Disciplina pode ainda não estar listável (race); grava direto.
  const stored = readStore() ?? [];
  const row: GradeRow = {
    id: newId(),
    subjectId: input.subjectId,
    subjectName: input.subjectName,
    color: input.color,
    attendancePercent: 100,
  };
  writeStore([...stored, row]);
  return row;
}

export function formatGrade(value?: number | null): string {
  if (value === undefined || value === null || !Number.isFinite(value)) {
    return "—";
  }
  return value.toFixed(1).replace(".", ",");
}

export function formatActiveSubjects(count: number): string {
  return String(count).padStart(2, "0");
}
