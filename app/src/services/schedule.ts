/**
 * Service da grade horária — mock do Figma tela 03.
 */

import type { SubjectColor } from "../types";

export type ScheduleSlot = {
  id: string;
  dayOfWeek: 1 | 2 | 3 | 4 | 5;
  startTime: string;
  title: string;
  room: string;
  color: SubjectColor;
};

export const WEEK_DAYS = [
  { day: 1 as const, label: "Segunda" },
  { day: 2 as const, label: "Terça" },
  { day: 3 as const, label: "Quarta" },
  { day: 4 as const, label: "Quinta" },
  { day: 5 as const, label: "Sexta" },
];

export const TIME_SLOTS = [
  "08:00",
  "10:00",
  "12:00",
  "14:00",
  "16:00",
  "18:00",
];

const MOCK_SLOTS: ScheduleSlot[] = [
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

export async function listScheduleSlots(): Promise<ScheduleSlot[]> {
  return MOCK_SLOTS;
}
