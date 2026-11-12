import type { CalendarEvent } from "../types";

const MOCK_EVENTS: CalendarEvent[] = [
  {
    id: "e1",
    title: "Entrega de lista",
    date: "2026-11-03",
    color: "pink",
    type: "entrega",
  },
  {
    id: "e2",
    title: "Revisão SQL",
    date: "2026-11-05",
    color: "mint",
    type: "outro",
  },
  {
    id: "e3",
    title: "Redes - trabalho",
    date: "2026-11-13",
    color: "mint",
    type: "entrega",
  },
  {
    id: "e4",
    title: "Prova Cálculo 1",
    date: "2026-11-18",
    color: "pink",
    type: "prova",
  },
  {
    id: "e5",
    title: "Seminário",
    date: "2026-11-20",
    color: "yellow",
    type: "outro",
  },
  {
    id: "e6",
    title: "Quiz Algoritmos",
    date: "2026-11-24",
    color: "blue",
    type: "prova",
  },
  {
    id: "e7",
    title: "Entrega do projeto",
    date: "2026-11-27",
    color: "lavender",
    type: "entrega",
  },
];

/** Lista lateral “Próximos eventos” (labels do Figma) */
export type UpcomingEvent = {
  id: string;
  dayLabel: string;
  title: string;
  color: CalendarEvent["color"];
};

const UPCOMING: UpcomingEvent[] = [
  { id: "u1", dayLabel: "13 NOV", title: "Trabalho de Redes", color: "mint" },
  { id: "u2", dayLabel: "18 NOV", title: "Prova Cálculo 1", color: "pink" },
  { id: "u3", dayLabel: "20 NOV", title: "Seminário", color: "yellow" },
  { id: "u4", dayLabel: "24 NOV", title: "Quiz Algoritmos", color: "blue" },
  { id: "u5", dayLabel: "27 NOV", title: "Projeto final", color: "lavender" },
];

export async function listCalendarEvents(): Promise<CalendarEvent[]> {
  return MOCK_EVENTS;
}

export async function listUpcomingEvents(): Promise<UpcomingEvent[]> {
  return UPCOMING;
}
