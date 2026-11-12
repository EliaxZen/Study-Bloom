/**
 * Service de disciplinas
 * ----------------------
 * CRUD com persistência local (localStorage) — mesmo padrão de tasks/reminders.
 * IDs seed (calc-1, redes, …) permanecem estáveis para deep links do Figma.
 */

import type { Subject, SubjectColor } from "../types";

const STORAGE_KEY = "study-bloom.subjects.v1";

const COLORS: SubjectColor[] = [
  "pink",
  "mint",
  "lavender",
  "yellow",
  "blue",
];

export const SUBJECT_ICON_OPTIONS = [
  "∫",
  "</>",
  "⌘",
  "▦",
  "✎",
  "✿",
  "λ",
  "Σ",
  "π",
  "⚙",
  "◆",
  "★",
] as const;

export const SUBJECT_COVER_OPTIONS = [
  "",
  "✿",
  "✧",
  "◈",
  "○",
  "◇",
  "✦",
  "❀",
  "☾",
  "☁",
] as const;

export const SUBJECT_COLOR_OPTIONS: {
  value: SubjectColor;
  label: string;
}[] = [
  { value: "pink", label: "Rosa" },
  { value: "mint", label: "Menta" },
  { value: "lavender", label: "Lavanda" },
  { value: "yellow", label: "Amarelo" },
  { value: "blue", label: "Azul" },
];

/** Seed alinhado ao Figma — deep links em contentRoutes.ts */
const SEED_SUBJECTS: Subject[] = [
  {
    id: "calc-1",
    name: "Cálculo 1",
    description: "Integrais, derivadas e aplicações.",
    color: "pink",
    icon: "∫",
    cover: "✧",
    materialsCount: 12,
  },
  {
    id: "redes",
    name: "Redes de Computadores",
    description: "Protocolos, TCP/IP e roteamento.",
    color: "mint",
    icon: "⌘",
    cover: "☁",
    materialsCount: 9,
  },
  {
    id: "algoritmos",
    name: "Algoritmos e Programação",
    description: "Python, estruturas e projetos.",
    color: "lavender",
    icon: "</>",
    cover: "λ",
    materialsCount: 16,
  },
  {
    id: "bd",
    name: "Banco de Dados",
    description: "SQL, modelagem e consultas.",
    color: "yellow",
    icon: "▦",
    cover: "◈",
    materialsCount: 7,
  },
  {
    id: "es",
    name: "Engenharia de Software",
    description: "Requisitos, Git e desenvolvimento.",
    color: "blue",
    icon: "✎",
    cover: "✦",
    materialsCount: 6,
  },
];

export type SubjectInput = {
  name: string;
  description?: string;
  color?: SubjectColor;
  icon?: string;
  cover?: string;
};

function cloneSubjects(list: Subject[]): Subject[] {
  return list.map((s) => ({ ...s }));
}

function normalizeColor(color: unknown): SubjectColor {
  return COLORS.includes(color as SubjectColor)
    ? (color as SubjectColor)
    : "lavender";
}

function normalizeSubject(raw: unknown): Subject | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as Record<string, unknown>;
  const id = String(s.id ?? "").trim();
  const name = String(s.name ?? "").trim();
  if (!id || !name) return null;
  const cover =
    typeof s.cover === "string" && s.cover.trim() ? s.cover.trim() : undefined;
  return {
    id,
    name,
    description: String(s.description ?? ""),
    color: normalizeColor(s.color),
    icon: String(s.icon ?? "✿") || "✿",
    ...(cover ? { cover } : {}),
    materialsCount: Number(s.materialsCount) || 0,
  };
}

function readStore(): Subject[] | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    const list = parsed
      .map(normalizeSubject)
      .filter((s): s is Subject => s !== null);
    return list.length > 0 ? list : null;
  } catch {
    return null;
  }
}

function writeStore(subjects: Subject[]): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(subjects));
}

function ensureStore(): Subject[] {
  const existing = readStore();
  if (existing) return existing;
  const seed = cloneSubjects(SEED_SUBJECTS);
  writeStore(seed);
  return seed;
}

function slugify(name: string): string {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return base || "disciplina";
}

function uniqueId(name: string, existing: Subject[]): string {
  const base = slugify(name);
  if (!existing.some((s) => s.id === base)) return base;
  let n = 2;
  while (existing.some((s) => s.id === `${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

async function mutate(
  updater: (subjects: Subject[]) => Subject[],
): Promise<Subject[]> {
  const current = await listSubjects();
  const next = updater(current);
  writeStore(next);
  return cloneSubjects(next);
}

/** Lista disciplinas; na 1ª visita semeia o mock do Figma. */
export async function listSubjects(): Promise<Subject[]> {
  return cloneSubjects(ensureStore());
}

export async function getSubjectById(id: string): Promise<Subject | undefined> {
  const subjects = await listSubjects();
  return subjects.find((s) => s.id === id);
}

export async function createSubject(input: SubjectInput): Promise<Subject> {
  const name = input.name.trim();
  if (!name) throw new Error("Informe o nome da disciplina.");

  const color = normalizeColor(input.color);
  const icon = (input.icon ?? "✿").trim() || "✿";
  const cover = (input.cover ?? "").trim();
  const description =
    (input.description ?? "").trim() || "Nova disciplina";

  const current = await listSubjects();
  const subject: Subject = {
    id: uniqueId(name, current),
    name,
    description,
    color,
    icon,
    ...(cover ? { cover } : {}),
    materialsCount: 0,
  };
  writeStore([...current, subject]);
  return { ...subject };
}

/** Patch parcial — Conteúdo (capa/ícone) não pode apagar nome/descrição/capa/materiais. */
export async function updateSubject(
  id: string,
  patch: Partial<SubjectInput>,
): Promise<Subject> {
  const current = await listSubjects();
  const index = current.findIndex((s) => s.id === id);
  if (index < 0) throw new Error("Disciplina não encontrada.");

  const subject = current[index];
  const name =
    patch.name !== undefined ? patch.name.trim() || subject.name : subject.name;
  const description =
    patch.description !== undefined
      ? patch.description.trim()
      : subject.description;
  const color =
    patch.color !== undefined ? normalizeColor(patch.color) : subject.color;
  const icon =
    patch.icon !== undefined
      ? patch.icon.trim() || subject.icon
      : subject.icon;

  const next: Subject = {
    ...subject,
    name,
    description,
    color,
    icon,
    materialsCount: subject.materialsCount,
  };

  // Só mexe em cover quando o caller envia o campo (Disciplinas).
  if (patch.cover !== undefined) {
    const cover = patch.cover.trim();
    if (cover) next.cover = cover;
    else delete next.cover;
  }

  const list = [...current];
  list[index] = next;
  writeStore(list);
  return { ...next };
}

export async function deleteSubject(id: string): Promise<void> {
  const current = await listSubjects();
  if (!current.some((s) => s.id === id)) {
    throw new Error("Disciplina não encontrada.");
  }
  await mutate((subjects) => subjects.filter((s) => s.id !== id));
}
