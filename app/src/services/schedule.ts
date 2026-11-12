/**
 * Grade horária — CRUD com persistência local (localStorage).
 * Seed inicial espelha o mock do Figma (tela 03).
 */

import type { SubjectColor } from "../types";

const STORAGE_KEY = "study-bloom-schedule";

const COLORS: SubjectColor[] = [
  "pink",
  "mint",
  "lavender",
  "yellow",
  "blue",
];

export const COLOR_OPTIONS: { value: SubjectColor; label: string }[] = [
  { value: "pink", label: "Rosa" },
  { value: "mint", label: "Menta" },
  { value: "lavender", label: "Lavanda" },
  { value: "yellow", label: "Amarelo" },
  { value: "blue", label: "Azul" },
];

export type WeekDay = 1 | 2 | 3 | 4 | 5;

export type ScheduleSlot = {
  id: string;
  dayOfWeek: WeekDay;
  startTime: string;
  title: string;
  room: string;
  color: SubjectColor;
};

export type ScheduleSlotInput = {
  dayOfWeek: WeekDay;
  startTime: string;
  title: string;
  room?: string;
  color?: SubjectColor;
};

export const WEEK_DAYS = [
  { day: 1 as const, label: "Segunda", short: "Seg" },
  { day: 2 as const, label: "Terça", short: "Ter" },
  { day: 3 as const, label: "Quarta", short: "Qua" },
  { day: 4 as const, label: "Quinta", short: "Qui" },
  { day: 5 as const, label: "Sexta", short: "Sex" },
];

export const TIME_SLOTS = [
  "08:00",
  "10:00",
  "12:00",
  "14:00",
  "16:00",
  "18:00",
];

const SEED: ScheduleSlot[] = [
  {
    id: "s1",
    dayOfWeek: 1,
    startTime: "08:00",
    title: "Cálculo 1",
    room: "ICC",
    color: "pink",
  },
  {
    id: "s2",
    dayOfWeek: 1,
    startTime: "12:00",
    title: "Redes",
    room: "Sala B2",
    color: "mint",
  },
  {
    id: "s3",
    dayOfWeek: 2,
    startTime: "08:00",
    title: "Algoritmos",
    room: "Lab 2",
    color: "lavender",
  },
  {
    id: "s4",
    dayOfWeek: 2,
    startTime: "14:00",
    title: "Banco de Dados",
    room: "Sala A4",
    color: "yellow",
  },
  {
    id: "s5",
    dayOfWeek: 3,
    startTime: "08:00",
    title: "Cálculo 1",
    room: "ICC",
    color: "pink",
  },
  {
    id: "s6",
    dayOfWeek: 3,
    startTime: "10:00",
    title: "Redes",
    room: "Sala B2",
    color: "mint",
  },
  {
    id: "s7",
    dayOfWeek: 4,
    startTime: "12:00",
    title: "Algoritmos",
    room: "Lab 2",
    color: "lavender",
  },
  {
    id: "s8",
    dayOfWeek: 4,
    startTime: "16:00",
    title: "Banco de Dados",
    room: "Sala A4",
    color: "yellow",
  },
  {
    id: "s9",
    dayOfWeek: 5,
    startTime: "10:00",
    title: "Projeto de Extensão",
    room: "Sala multiuso",
    color: "blue",
  },
  {
    id: "s10",
    dayOfWeek: 5,
    startTime: "14:00",
    title: "Monitoria",
    room: "Online",
    color: "mint",
  },
];

function isWeekDay(n: number): n is WeekDay {
  return n === 1 || n === 2 || n === 3 || n === 4 || n === 5;
}

function normalizeSlot(raw: Partial<ScheduleSlot>): ScheduleSlot | null {
  const day = Number(raw.dayOfWeek);
  const startTime = String(raw.startTime ?? "");
  if (!isWeekDay(day) || !TIME_SLOTS.includes(startTime)) return null;
  const color = COLORS.includes(raw.color as SubjectColor)
    ? (raw.color as SubjectColor)
    : "lavender";
  return {
    id: String(raw.id ?? newId()),
    dayOfWeek: day,
    startTime,
    title: String(raw.title ?? "").trim() || "Aula",
    room: String(raw.room ?? "").trim(),
    color,
  };
}

function readStore(): ScheduleSlot[] | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ScheduleSlot>[];
    if (!Array.isArray(parsed)) return null;
    return parsed
      .map(normalizeSlot)
      .filter((s): s is ScheduleSlot => s !== null);
  } catch {
    return null;
  }
}

function writeStore(items: ScheduleSlot[]): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function ensureStore(): ScheduleSlot[] {
  // `[]` é válido (usuária apagou tudo) — só ressemear quando a chave não existe.
  const existing = readStore();
  if (existing !== null) return existing;
  const seed = SEED.map((s) => ({ ...s }));
  try {
    writeStore(seed);
  } catch {
    // quota / private mode — Início ainda recebe o seed em memória
  }
  return seed;
}

function sortSlots(items: ScheduleSlot[]): ScheduleSlot[] {
  return [...items].sort((a, b) => {
    if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
    return a.startTime.localeCompare(b.startTime);
  });
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `s-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function assertSlotInput(input: ScheduleSlotInput): {
  title: string;
  room: string;
  dayOfWeek: WeekDay;
  startTime: string;
  color: SubjectColor;
} {
  const title = input.title.trim();
  if (!title) throw new Error("Informe a disciplina ou título");
  if (!isWeekDay(input.dayOfWeek)) throw new Error("Dia inválido");
  if (!TIME_SLOTS.includes(input.startTime)) {
    throw new Error("Horário inválido");
  }
  const color =
    input.color && COLORS.includes(input.color) ? input.color : "lavender";
  return {
    title,
    room: (input.room ?? "").trim(),
    dayOfWeek: input.dayOfWeek,
    startTime: input.startTime,
    color,
  };
}

export async function listScheduleSlots(): Promise<ScheduleSlot[]> {
  return sortSlots(ensureStore());
}

function conflictMessage(clash: ScheduleSlot): string {
  return `Já existe aula neste horário (${clash.title})`;
}

/** Conflito no mesmo dia+horário; `ignoreId` ignora o slot em edição. */
export function findScheduleConflict(
  dayOfWeek: WeekDay,
  startTime: string,
  ignoreId?: string,
): ScheduleSlot | null {
  const items = ensureStore();
  return (
    items.find(
      (s) =>
        s.dayOfWeek === dayOfWeek &&
        s.startTime === startTime &&
        s.id !== ignoreId,
    ) ?? null
  );
}

export async function createScheduleSlot(
  input: ScheduleSlotInput,
): Promise<ScheduleSlot> {
  const data = assertSlotInput(input);
  const items = ensureStore();
  const clash = findScheduleConflict(data.dayOfWeek, data.startTime);
  if (clash) {
    throw new Error(conflictMessage(clash));
  }
  const slot: ScheduleSlot = {
    id: newId(),
    ...data,
  };
  writeStore(sortSlots([...items, slot]));
  return slot;
}

export async function updateScheduleSlot(
  id: string,
  input: ScheduleSlotInput,
): Promise<ScheduleSlot> {
  const data = assertSlotInput(input);
  const items = ensureStore();
  const idx = items.findIndex((s) => s.id === id);
  if (idx < 0) throw new Error("Aula não encontrada");

  const clash = findScheduleConflict(data.dayOfWeek, data.startTime, id);
  if (clash) {
    throw new Error(conflictMessage(clash));
  }

  const updated: ScheduleSlot = { id, ...data };
  const next = [...items];
  next[idx] = updated;
  writeStore(sortSlots(next));
  return updated;
}

export async function deleteScheduleSlot(id: string): Promise<void> {
  const items = ensureStore();
  if (!items.some((s) => s.id === id)) {
    throw new Error("Aula não encontrada");
  }
  writeStore(items.filter((s) => s.id !== id));
}

/** Segunda–sexta da semana civil (ISO: segunda = início). */
export function getWeekRange(now = new Date()): { start: Date; end: Date } {
  const day = now.getDay(); // 0=dom … 6=sáb
  const offsetToMonday = day === 0 ? -6 : 1 - day;
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  start.setDate(start.getDate() + offsetToMonday);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 4);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

/** Ex.: "Semana 09–13 nov" ou "Semana 30 mar – 03 abr" */
export function formatCurrentWeekBadge(now = new Date()): string {
  const { start, end } = getWeekRange(now);
  const dayFmt = (d: Date) => String(d.getDate()).padStart(2, "0");
  const monthFmt = (d: Date) =>
    d
      .toLocaleDateString("pt-BR", { month: "short" })
      .replace(/\./g, "")
      .replace(/\s/g, "");

  if (start.getMonth() === end.getMonth()) {
    return `Semana ${dayFmt(start)}–${dayFmt(end)} ${monthFmt(start)}`;
  }
  return `Semana ${dayFmt(start)} ${monthFmt(start)} – ${dayFmt(end)} ${monthFmt(end)}`;
}

/** 1=seg … 5=sex; null no fim de semana */
export function getCurrentWeekDay(now = new Date()): WeekDay | null {
  const js = now.getDay();
  if (js >= 1 && js <= 5) return js as WeekDay;
  return null;
}
