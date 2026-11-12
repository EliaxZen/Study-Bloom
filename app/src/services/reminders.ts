import type { Reminder, FocusSession } from "../types";

const MOCK_REMINDERS: Reminder[] = [
  {
    id: "r1",
    title: "Revisar integrais para a prova",
    datetime: "2026-11-12T09:00:00",
    color: "pink",
  },
  {
    id: "r2",
    title: "Entregar trabalho de Redes",
    datetime: "2026-11-13T18:00:00",
    color: "mint",
  },
  {
    id: "r3",
    title: "Praticar consultas SQL",
    datetime: "2026-11-16T14:00:00",
    color: "yellow",
  },
  {
    id: "r4",
    title: "Prova de Cálculo 1",
    datetime: "2026-11-18T08:00:00",
    color: "lavender",
  },
];

const MOCK_FOCUS: FocusSession = {
  id: "focus-1",
  durationMinutes: 25,
  completedCycles: 0,
  targetCycles: 4,
};

export async function listReminders(): Promise<Reminder[]> {
  return MOCK_REMINDERS;
}

export async function getFocusSession(): Promise<FocusSession> {
  return MOCK_FOCUS;
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
