/**
 * Lembretes — CRUD com persistência local (localStorage).
 * Notificações nativas ficam a cargo do agent de notifications.
 */

import type { FocusSession, Reminder, SubjectColor } from "../types";

const STORAGE_KEY = "study-bloom-reminders";

const COLORS: SubjectColor[] = [
  "pink",
  "mint",
  "yellow",
  "lavender",
  "blue",
];

const SEED: Reminder[] = [
  {
    id: "r1",
    title: "Revisar integrais para a prova",
    datetime: "2026-11-12T09:00:00",
    color: "pink",
    completed: false,
  },
  {
    id: "r2",
    title: "Entregar trabalho de Redes",
    datetime: "2026-11-13T18:00:00",
    color: "mint",
    completed: false,
  },
  {
    id: "r3",
    title: "Praticar consultas SQL",
    datetime: "2026-11-16T14:00:00",
    color: "yellow",
    completed: false,
  },
  {
    id: "r4",
    title: "Prova de Cálculo 1",
    datetime: "2026-11-18T08:00:00",
    color: "lavender",
    completed: false,
  },
];

const MOCK_FOCUS: FocusSession = {
  id: "focus-1",
  durationMinutes: 25,
  completedCycles: 0,
  targetCycles: 4,
};

export type ReminderInput = {
  title: string;
  datetime: string;
  color?: SubjectColor;
  taskId?: string;
  eventId?: string;
};

function readStore(): Reminder[] | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Reminder[];
    if (!Array.isArray(parsed)) return null;
    return parsed.map(normalizeReminder);
  } catch {
    return null;
  }
}

function writeStore(items: Reminder[]): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function normalizeReminder(r: Reminder): Reminder {
  return {
    id: String(r.id),
    title: String(r.title ?? ""),
    datetime: String(r.datetime ?? ""),
    color: (COLORS.includes(r.color) ? r.color : "lavender") as SubjectColor,
    completed: Boolean(r.completed),
    ...(r.taskId ? { taskId: String(r.taskId) } : {}),
    ...(r.eventId ? { eventId: String(r.eventId) } : {}),
  };
}

function ensureStore(): Reminder[] {
  const existing = readStore();
  if (existing) return existing;
  const seed = SEED.map((r) => ({ ...r }));
  writeStore(seed);
  return seed;
}

function sortReminders(items: Reminder[]): Reminder[] {
  return [...items].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return a.datetime.localeCompare(b.datetime);
  });
}

function nextColor(items: Reminder[]): SubjectColor {
  return COLORS[items.length % COLORS.length];
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `r-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function listReminders(): Promise<Reminder[]> {
  return sortReminders(ensureStore());
}

export async function createReminder(input: ReminderInput): Promise<Reminder> {
  const title = input.title.trim();
  if (!title) throw new Error("Título obrigatório");
  if (!input.datetime) throw new Error("Data/hora obrigatória");

  const items = ensureStore();
  const reminder: Reminder = {
    id: newId(),
    title,
    datetime: toIsoLocal(input.datetime),
    color: input.color ?? nextColor(items),
    completed: false,
    ...(input.taskId ? { taskId: input.taskId } : {}),
    ...(input.eventId ? { eventId: input.eventId } : {}),
  };
  const next = sortReminders([...items, reminder]);
  writeStore(next);
  return reminder;
}

export async function updateReminder(
  id: string,
  patch: Partial<ReminderInput> & { completed?: boolean },
): Promise<Reminder> {
  const items = ensureStore();
  const idx = items.findIndex((r) => r.id === id);
  if (idx < 0) throw new Error("Lembrete não encontrado");

  const current = items[idx];
  const title =
    patch.title !== undefined ? patch.title.trim() : current.title;
  if (!title) throw new Error("Título obrigatório");

  const updated: Reminder = {
    ...current,
    title,
    datetime:
      patch.datetime !== undefined
        ? toIsoLocal(patch.datetime)
        : current.datetime,
    color: patch.color ?? current.color,
    completed:
      patch.completed !== undefined ? patch.completed : current.completed,
  };

  if (patch.taskId !== undefined) {
    if (patch.taskId) updated.taskId = patch.taskId;
    else delete updated.taskId;
  }
  if (patch.eventId !== undefined) {
    if (patch.eventId) updated.eventId = patch.eventId;
    else delete updated.eventId;
  }

  const next = [...items];
  next[idx] = updated;
  writeStore(sortReminders(next));
  return updated;
}

export async function completeReminder(id: string): Promise<Reminder> {
  const items = ensureStore();
  const current = items.find((r) => r.id === id);
  if (!current) throw new Error("Lembrete não encontrado");
  return updateReminder(id, { completed: !current.completed });
}

export async function deleteReminder(id: string): Promise<void> {
  const items = ensureStore();
  writeStore(items.filter((r) => r.id !== id));
}

export async function getFocusSession(): Promise<FocusSession> {
  return { ...MOCK_FOCUS };
}

/** Converte valor de datetime-local ou ISO para ISO sem timezone forçado */
export function toIsoLocal(value: string): string {
  if (!value) return value;
  // datetime-local: "2026-11-12T09:00" → guarda com segundos
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    return `${value}:00`;
  }
  return value;
}

/** Valor para input[type=datetime-local] */
export function toDatetimeLocalValue(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return iso.slice(0, 16);
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatReminderWhen(iso: string, now = new Date()): string {
  const date = new Date(iso);
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const time = date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (sameDay(date, now)) {
    return `Hoje · ${time}`;
  }

  if (sameDay(date, tomorrow)) {
    return `Amanhã · ${time}`;
  }

  const dayMonth = date
    .toLocaleDateString("pt-BR", { day: "numeric", month: "short" })
    .replace(/\./g, "")
    .replace(" de ", " ");
  return `${dayMonth} · ${time}`;
}
