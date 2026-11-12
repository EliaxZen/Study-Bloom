/**
 * Agregação da Visão geral (Inicio)
 * ---------------------------------
 * Stats / agenda / entregas vêm de tasks, schedule, calendar e grades.
 * Tarefas seguem o Kanban; checklist local só cobre eventos de entrega.
 * Se o DB/services vierem vazios ou falharem → fallback seguro.
 */

import {
  compareAsc,
  differenceInCalendarDays,
  format,
  isToday,
  isTomorrow,
  parseISO,
  startOfDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import type { SubjectColor, Task } from "../types";
import { listCalendarEvents, toLocalIsoDate } from "./calendar";
import { listGrades } from "./grades";
import { getCurrentWeekDay, listScheduleSlots } from "./schedule";
import { listTasks, setTaskStatus } from "./tasks";

export type AgendaItem = {
  id: string;
  time: string;
  title: string;
  detail: string;
  color: SubjectColor;
};

export type DeliveryItem = {
  id: string;
  title: string;
  when: string;
  done: boolean;
};

export type DashboardStat = {
  id: string;
  label: string;
  value: string;
  iconTone: "lavender" | "blue" | "pink";
};

type DeliveryDraft = DeliveryItem & { sortDate?: string };

const CHECKLIST_KEY = "study-bloom-delivery-checklist";
const DELIVERY_LIMIT = 6;

/** Stats neutros quando services/DB estão vazios ou falham. */
export const EMPTY_DASHBOARD_STATS: DashboardStat[] = [
  {
    id: "pending",
    label: "Tarefas pendentes",
    value: "00",
    iconTone: "lavender",
  },
  {
    id: "classes",
    label: "Aulas nesta semana",
    value: "00",
    iconTone: "blue",
  },
  {
    id: "exam",
    label: "Próxima avaliação",
    value: "—",
    iconTone: "pink",
  },
];

async function safeCall<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    const value = await fn();
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function pad2(n: number): string {
  return String(Math.max(0, n)).padStart(2, "0");
}

function loadChecklist(): Record<string, boolean> {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(CHECKLIST_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    const out: Record<string, boolean> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "boolean") out[key] = value;
    }
    return out;
  } catch {
    return {};
  }
}

function saveChecklist(map: Record<string, boolean>): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(CHECKLIST_KEY, JSON.stringify(map));
  } catch {
    // quota / private mode
  }
}

function capitalize(label: string): string {
  if (!label) return label;
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatWhen(isoDate: string | undefined, done: boolean): string {
  if (done) return "Concluído";
  if (!isoDate) return "Pendente";
  try {
    const date = parseISO(isoDate);
    if (Number.isNaN(date.getTime())) return "Pendente";
    if (isToday(date)) return "Hoje";
    if (isTomorrow(date)) return "Amanhã";
    const days = differenceInCalendarDays(date, startOfDay(new Date()));
    if (days >= 0 && days < 7) {
      return capitalize(
        format(date, "EEEE", { locale: ptBR }).replace("-feira", ""),
      );
    }
    return capitalize(
      format(date, "d MMM", { locale: ptBR }).replace(/\./g, ""),
    );
  } catch {
    return "Pendente";
  }
}

function formatExamDate(isoDate: string): string {
  try {
    const date = parseISO(isoDate);
    if (Number.isNaN(date.getTime())) return "—";
    return capitalize(
      format(date, "d MMM", { locale: ptBR }).replace(/\./g, ""),
    );
  } catch {
    return "—";
  }
}

/**
 * Tarefas: Kanban (task.status) é a fonte da verdade.
 * Eventos de calendário: só o checklist local (não têm coluna no board).
 */
function resolveDone(
  id: string,
  baseDone: boolean,
  checklist: Record<string, boolean>,
): boolean {
  if (id.startsWith("task:")) return baseDone;
  if (Object.prototype.hasOwnProperty.call(checklist, id)) {
    return checklist[id];
  }
  return baseDone;
}

/** Persiste o toggle do checklist de entregas na Visão geral. */
export async function setDeliveryDone(
  id: string,
  done: boolean,
): Promise<void> {
  // task:* → setTaskStatus (Kanban). Falha propaga p/ rollback otimista na UI.
  if (id.startsWith("task:")) {
    const taskId = id.slice("task:".length);
    if (!taskId) throw new Error("Tarefa inválida");
    const tasks = await listTasks();
    if (!tasks.some((t) => t.id === taskId)) {
      throw new Error("Tarefa não encontrada");
    }
    await setTaskStatus(taskId, done ? "done" : "todo");
    const map = loadChecklist();
    if (Object.prototype.hasOwnProperty.call(map, id)) {
      delete map[id];
      saveChecklist(map);
    }
    return;
  }

  const map = loadChecklist();
  map[id] = done;
  saveChecklist(map);
}

export async function getDashboardStats(): Promise<DashboardStat[]> {
  const [tasks, slots, events, grades] = await Promise.all([
    safeCall(listTasks, [] as Awaited<ReturnType<typeof listTasks>>),
    safeCall(
      listScheduleSlots,
      [] as Awaited<ReturnType<typeof listScheduleSlots>>,
    ),
    safeCall(
      listCalendarEvents,
      [] as Awaited<ReturnType<typeof listCalendarEvents>>,
    ),
    safeCall(listGrades, [] as Awaited<ReturnType<typeof listGrades>>),
  ]);

  // Tudo vazio (DB fresco) → cards zerados, sem throw.
  if (
    tasks.length === 0 &&
    slots.length === 0 &&
    events.length === 0 &&
    grades.length === 0
  ) {
    return EMPTY_DASHBOARD_STATS.map((s) => ({ ...s }));
  }

  const pending = tasks.filter((t) => t.status !== "done").length;
  const classes = slots.length;

  // Data civil local (mesmo helper do calendário) — evita drift UTC no BR
  const today = toLocalIsoDate();
  const nextExam = events
    .filter((e) => e.type === "prova" && e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  return [
    {
      id: "pending",
      label: "Tarefas pendentes",
      value: pad2(pending),
      iconTone: "lavender",
    },
    {
      id: "classes",
      label: "Aulas nesta semana",
      value: pad2(classes),
      iconTone: "blue",
    },
    {
      id: "exam",
      label: "Próxima avaliação",
      value: nextExam ? formatExamDate(nextExam.date) : "—",
      iconTone: "pink",
    },
  ];
}

export async function getTodayAgenda(): Promise<AgendaItem[]> {
  const slots = await safeCall(
    listScheduleSlots,
    [] as Awaited<ReturnType<typeof listScheduleSlots>>,
  );

  // Mesma regra da grade (P11): 1=seg…5=sex; null no fim de semana
  const day = getCurrentWeekDay();
  if (day === null) return [];

  return slots
    .filter((s) => s.dayOfWeek === day)
    .slice()
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
    .map((s) => ({
      id: s.id,
      time: s.startTime,
      title: s.title,
      detail: s.room || "—",
      color: s.color,
    }));
}

function taskToDelivery(task: Task): DeliveryDraft {
  const id = `task:${task.id}`;
  const done = task.status === "done";
  return {
    id,
    title: task.title,
    when: formatWhen(task.dueDate, done),
    done,
    sortDate: task.dueDate,
  };
}

export async function getUpcomingDeliveries(): Promise<DeliveryItem[]> {
  const checklist = loadChecklist();
  const [tasks, events] = await Promise.all([
    safeCall(listTasks, [] as Awaited<ReturnType<typeof listTasks>>),
    safeCall(
      listCalendarEvents,
      [] as Awaited<ReturnType<typeof listCalendarEvents>>,
    ),
  ]);

  const today = toLocalIsoDate();
  const items: DeliveryDraft[] = [];

  for (const event of events) {
    if (event.type !== "entrega") continue;
    if (event.date < today) continue;
    const id = `event:${event.id}`;
    const done = resolveDone(id, false, checklist);
    items.push({
      id,
      title: event.title,
      when: formatWhen(event.date, done),
      done,
      sortDate: event.date,
    });
  }

  // Preferir tarefas com prazo; se nenhuma tiver, mostrar pendentes do Kanban
  const tasksWithDue = tasks.filter((t) => Boolean(t.dueDate));
  const sourceTasks =
    tasksWithDue.length > 0
      ? tasksWithDue
      : tasks.filter((t) => t.status !== "done").slice(0, DELIVERY_LIMIT);

  for (const task of sourceTasks) {
    items.push(taskToDelivery(task));
  }

  items.sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    if (a.sortDate && b.sortDate) {
      try {
        return compareAsc(parseISO(a.sortDate), parseISO(b.sortDate));
      } catch {
        return a.sortDate.localeCompare(b.sortDate);
      }
    }
    if (a.sortDate) return -1;
    if (b.sortDate) return 1;
    return a.title.localeCompare(b.title, "pt-BR");
  });

  return items.slice(0, DELIVERY_LIMIT).map(({ sortDate, ...rest }) => {
    void sortDate;
    return rest;
  });
}
