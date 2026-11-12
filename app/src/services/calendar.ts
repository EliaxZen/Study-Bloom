/**
 * Calendário acadêmico — CRUD com persistência local (localStorage).
 */

import type {
  CalendarEvent,
  CalendarEventType,
  SubjectColor,
} from "../types";

const STORAGE_KEY = "study-bloom-calendar-events";

const COLORS: SubjectColor[] = [
  "pink",
  "mint",
  "yellow",
  "lavender",
  "blue",
];

const TYPES: CalendarEventType[] = ["prova", "entrega", "aula", "outro"];

const SEED: CalendarEvent[] = [
  {
    id: "e1",
    title: "Entrega de lista",
    date: "2026-11-03",
    color: "pink",
    type: "entrega",
    alertEnabled: true,
    alertMinutesBefore: 1440,
  },
  {
    id: "e2",
    title: "Revisão SQL",
    date: "2026-11-05",
    color: "mint",
    type: "outro",
    alertEnabled: false,
    alertMinutesBefore: 60,
  },
  {
    id: "e3",
    title: "Redes - trabalho",
    date: "2026-11-13",
    color: "mint",
    type: "entrega",
    alertEnabled: true,
    alertMinutesBefore: 1440,
  },
  {
    id: "e4",
    title: "Prova Cálculo 1",
    date: "2026-11-18",
    color: "pink",
    type: "prova",
    alertEnabled: true,
    alertMinutesBefore: 2880,
  },
  {
    id: "e5",
    title: "Seminário",
    date: "2026-11-20",
    color: "yellow",
    type: "outro",
    alertEnabled: true,
    alertMinutesBefore: 60,
  },
  {
    id: "e6",
    title: "Quiz Algoritmos",
    date: "2026-11-24",
    color: "blue",
    type: "prova",
    alertEnabled: true,
    alertMinutesBefore: 1440,
  },
  {
    id: "e7",
    title: "Entrega do projeto",
    date: "2026-11-27",
    color: "lavender",
    type: "entrega",
    alertEnabled: true,
    alertMinutesBefore: 2880,
  },
];

/** Lista lateral “Próximos eventos” */
export type UpcomingEvent = {
  id: string;
  dayLabel: string;
  title: string;
  color: CalendarEvent["color"];
};

export type CalendarEventInput = {
  title: string;
  date: string;
  color?: SubjectColor;
  type?: CalendarEventType;
  alertEnabled?: boolean;
  alertMinutesBefore?: number;
};

function readStore(): CalendarEvent[] | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CalendarEvent[];
    if (!Array.isArray(parsed)) return null;
    return parsed.map(normalizeEvent);
  } catch {
    return null;
  }
}

function writeStore(items: CalendarEvent[]): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function normalizeEvent(e: CalendarEvent): CalendarEvent {
  const type = TYPES.includes(e.type) ? e.type : "outro";
  const color = COLORS.includes(e.color) ? e.color : "lavender";
  const minutes =
    typeof e.alertMinutesBefore === "number" && e.alertMinutesBefore >= 0
      ? e.alertMinutesBefore
      : 1440;
  let date = String(e.date ?? "").trim().slice(0, 10);
  try {
    date = normalizeIsoDate(date);
  } catch {
    date = toLocalIsoDate();
  }
  return {
    id: String(e.id),
    title: String(e.title ?? ""),
    date,
    color,
    type,
    alertEnabled: Boolean(e.alertEnabled),
    alertMinutesBefore: minutes,
  };
}

function ensureStore(): CalendarEvent[] {
  const existing = readStore();
  if (existing) return existing;
  const seed = SEED.map((e) => ({ ...e }));
  writeStore(seed);
  return seed;
}

function sortEvents(items: CalendarEvent[]): CalendarEvent[] {
  return [...items].sort((a, b) => a.date.localeCompare(b.date));
}

function nextColor(items: CalendarEvent[]): SubjectColor {
  return COLORS[items.length % COLORS.length];
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Data local YYYY-MM-DD (evita deslocamento de fuso do toISOString). */
export function toLocalIsoDate(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Valida YYYY-MM-DD e garante dia real no calendário (ex.: rejeita 2026-02-31). */
export function normalizeIsoDate(raw: string): string {
  const date = String(raw ?? "").trim().slice(0, 10);
  if (!ISO_DATE_RE.test(date)) {
    throw new Error("Data inválida");
  }
  const [y, m, d] = date.split("-").map(Number);
  const check = new Date(y, m - 1, d);
  if (
    check.getFullYear() !== y ||
    check.getMonth() !== m - 1 ||
    check.getDate() !== d
  ) {
    throw new Error("Data inválida");
  }
  return date;
}

function formatDayLabel(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return isoDate;
  const date = new Date(y, m - 1, d);
  const month = date
    .toLocaleDateString("pt-BR", { month: "short" })
    .replace(/\./g, "")
    .toUpperCase();
  return `${String(d).padStart(2, "0")} ${month}`;
}

export async function listCalendarEvents(): Promise<CalendarEvent[]> {
  return sortEvents(ensureStore());
}

export async function listUpcomingEvents(
  limit = 5,
  now = new Date(),
): Promise<UpcomingEvent[]> {
  const today = toLocalIsoDate(now);
  return sortEvents(ensureStore())
    .filter((e) => e.date >= today)
    .slice(0, limit)
    .map((e) => ({
      id: e.id,
      dayLabel: formatDayLabel(e.date),
      title: e.title,
      color: e.color,
    }));
}

export async function getCalendarEvent(
  id: string,
): Promise<CalendarEvent | undefined> {
  return ensureStore().find((e) => e.id === id);
}

export async function createCalendarEvent(
  input: CalendarEventInput,
): Promise<CalendarEvent> {
  const title = input.title.trim();
  if (!title) throw new Error("Título obrigatório");
  if (!input.date) throw new Error("Data obrigatória");
  const date = normalizeIsoDate(input.date);

  const items = ensureStore();
  const event: CalendarEvent = {
    id: newId(),
    title,
    date,
    color: input.color ?? nextColor(items),
    type: input.type ?? "outro",
    alertEnabled:
      input.alertEnabled !== undefined ? Boolean(input.alertEnabled) : true,
    alertMinutesBefore:
      typeof input.alertMinutesBefore === "number"
        ? Math.max(0, input.alertMinutesBefore)
        : 1440,
  };
  const next = sortEvents([...items, event]);
  writeStore(next);
  return event;
}

export async function updateCalendarEvent(
  id: string,
  patch: Partial<CalendarEventInput>,
): Promise<CalendarEvent> {
  const items = ensureStore();
  const idx = items.findIndex((e) => e.id === id);
  if (idx < 0) throw new Error("Evento não encontrado");

  const current = items[idx];
  const title =
    patch.title !== undefined ? patch.title.trim() : current.title;
  if (!title) throw new Error("Título obrigatório");
  if (patch.date !== undefined && !patch.date) {
    throw new Error("Data obrigatória");
  }
  const date =
    patch.date !== undefined ? normalizeIsoDate(patch.date) : current.date;

  const updated: CalendarEvent = {
    ...current,
    title,
    date,
    color: patch.color ?? current.color,
    type: patch.type ?? current.type,
    alertEnabled:
      patch.alertEnabled !== undefined
        ? Boolean(patch.alertEnabled)
        : Boolean(current.alertEnabled),
    alertMinutesBefore:
      patch.alertMinutesBefore !== undefined
        ? Math.max(0, patch.alertMinutesBefore)
        : (current.alertMinutesBefore ?? 1440),
  };

  const next = [...items];
  next[idx] = updated;
  writeStore(sortEvents(next));
  return updated;
}

export async function deleteCalendarEvent(id: string): Promise<void> {
  const items = ensureStore();
  writeStore(items.filter((e) => e.id !== id));
}

export const ALERT_MINUTE_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: "No dia" },
  { value: 60, label: "1 hora antes" },
  { value: 1440, label: "1 dia antes" },
  { value: 2880, label: "2 dias antes" },
  { value: 10080, label: "1 semana antes" },
];

export const EVENT_TYPE_OPTIONS: {
  value: CalendarEventType;
  label: string;
}[] = [
  { value: "prova", label: "Prova" },
  { value: "entrega", label: "Entrega" },
  { value: "aula", label: "Aula" },
  { value: "outro", label: "Outro" },
];

export const EVENT_COLOR_OPTIONS: {
  value: SubjectColor;
  label: string;
}[] = [
  { value: "pink", label: "Rosa" },
  { value: "mint", label: "Menta" },
  { value: "yellow", label: "Amarelo" },
  { value: "lavender", label: "Lavanda" },
  { value: "blue", label: "Azul" },
];
