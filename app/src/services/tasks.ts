/**
 * Service de tarefas (Kanban)
 * ---------------------------
 * Persistência em localStorage até o CRUD SQLite estar ligado.
 * Em Tauri o mesmo storage cobre o webview; a tabela `tasks` já existe
 * em database.ts para a migração futura.
 */

import type { Task, TaskStatus } from "../types";

const STORAGE_KEY = "study-bloom.tasks.v1";

export type TaskPriority = "alta" | "media" | "baixa";

export type TaskInput = {
  title: string;
  subjectId: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
};

const PRIORITY_TAG: Record<TaskPriority, string> = {
  alta: "Alta prioridade",
  media: "Média prioridade",
  baixa: "Baixa prioridade",
};

const VALID_STATUS = new Set<TaskStatus>(["todo", "doing", "review", "done"]);

const SEED_TASKS: Task[] = [
  {
    id: "t1",
    title: "Lista de integrais",
    subjectId: "calc-1",
    status: "todo",
    tag: "Alta prioridade",
    dueDate: "2026-11-12",
  },
  {
    id: "t2",
    title: "Estudar sub-redes",
    subjectId: "redes",
    status: "todo",
    tag: "Média prioridade",
    dueDate: "2026-11-15",
  },
  {
    id: "t3",
    title: "Modelar banco",
    subjectId: "bd",
    status: "todo",
    tag: "Média prioridade",
    dueDate: "2026-11-14",
  },
  {
    id: "t4",
    title: "Projeto de Python",
    subjectId: "algoritmos",
    status: "doing",
    tag: "Alta prioridade",
  },
  {
    id: "t5",
    title: "Resumo de SQL",
    subjectId: "bd",
    status: "doing",
    tag: "Média prioridade",
  },
  {
    id: "t6",
    title: "Slides de Redes",
    subjectId: "redes",
    status: "review",
    tag: "Baixa prioridade",
  },
  {
    id: "t7",
    title: "Exercícios de limites",
    subjectId: "calc-1",
    status: "review",
    tag: "Média prioridade",
  },
  {
    id: "t8",
    title: "Quiz de derivadas",
    subjectId: "calc-1",
    status: "done",
    tag: "Baixa prioridade",
  },
  {
    id: "t9",
    title: "Configurar Git",
    subjectId: "es",
    status: "done",
    tag: "Baixa prioridade",
  },
  {
    id: "t10",
    title: "Leitura de RFC",
    subjectId: "redes",
    status: "done",
    tag: "Média prioridade",
  },
  {
    id: "t11",
    title: "Lista de funções",
    subjectId: "calc-1",
    status: "done",
    tag: "Baixa prioridade",
  },
];

export type KanbanColumnMeta = {
  status: TaskStatus;
  title: string;
  accent: string;
  tagClass: string;
};

export const KANBAN_COLUMNS: KanbanColumnMeta[] = [
  {
    status: "todo",
    title: "A fazer",
    accent: "bg-bloom-500",
    tagClass: "bg-pastel-lavender text-bloom-700",
  },
  {
    status: "doing",
    title: "Em andamento",
    accent: "bg-sky-400",
    tagClass: "bg-pastel-blue text-sky-800",
  },
  {
    status: "review",
    title: "Em revisão",
    accent: "bg-amber-400",
    tagClass: "bg-pastel-yellow text-amber-800",
  },
  {
    status: "done",
    title: "Concluído",
    accent: "bg-emerald-400",
    tagClass: "bg-pastel-mint text-emerald-800",
  },
];

export const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: "alta", label: "Alta prioridade" },
  { value: "media", label: "Média prioridade" },
  { value: "baixa", label: "Baixa prioridade" },
];

function cloneTasks(tasks: Task[]): Task[] {
  return tasks.map((t) => ({ ...t }));
}

function normalizeTask(raw: unknown): Task | null {
  if (!raw || typeof raw !== "object") return null;
  const t = raw as Record<string, unknown>;
  if (typeof t.id !== "string" || !t.id) return null;
  if (typeof t.title !== "string" || !t.title.trim()) return null;
  if (typeof t.subjectId !== "string" || !t.subjectId) return null;
  if (typeof t.status !== "string" || !VALID_STATUS.has(t.status as TaskStatus)) {
    return null;
  }
  const tag =
    typeof t.tag === "string" && t.tag.trim()
      ? t.tag
      : PRIORITY_TAG.media;
  const dueDate =
    typeof t.dueDate === "string" && t.dueDate.trim()
      ? t.dueDate
      : undefined;
  return {
    id: t.id,
    title: t.title.trim(),
    subjectId: t.subjectId,
    status: t.status as TaskStatus,
    tag,
    dueDate,
  };
}

function readStore(): Task[] | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    // Chave existe (mesmo `[]`) → não ressemear. Board vazio após deletes deve persistir.
    return parsed
      .map(normalizeTask)
      .filter((t): t is Task => t !== null);
  } catch {
    return null;
  }
}

function writeStore(tasks: Task[]): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `t-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function priorityFromTag(tag: string): TaskPriority {
  const lower = tag.toLowerCase();
  if (lower.includes("alta")) return "alta";
  if (lower.includes("baixa")) return "baixa";
  return "media";
}

export function tagFromPriority(priority: TaskPriority): string {
  return PRIORITY_TAG[priority];
}

export function formatDueLabel(dueDate?: string): string | null {
  if (!dueDate) return null;
  const date = new Date(`${dueDate}T12:00:00`);
  if (Number.isNaN(date.getTime())) return dueDate;
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

/** Lista tarefas; na 1ª visita semeia o mock e grava no store local. */
export async function listTasks(): Promise<Task[]> {
  const stored = readStore();
  if (stored) return cloneTasks(stored);
  const seed = cloneTasks(SEED_TASKS);
  writeStore(seed);
  return cloneTasks(seed);
}

/** Serializa mutações — evita race de DnD rápido sobrescrevendo o store. */
let mutateQueue: Promise<unknown> = Promise.resolve();

async function mutate(
  updater: (tasks: Task[]) => Task[],
): Promise<Task[]> {
  const run = async (): Promise<Task[]> => {
    const current = await listTasks();
    const next = updater(current);
    writeStore(next);
    return cloneTasks(next);
  };
  const result = mutateQueue.then(run, run);
  mutateQueue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

export async function createTask(input: TaskInput): Promise<Task> {
  const title = input.title.trim();
  if (!title) throw new Error("Título obrigatório");
  if (!input.subjectId) throw new Error("Disciplina obrigatória");
  if (!VALID_STATUS.has(input.status)) {
    throw new Error("Coluna inválida");
  }

  const task: Task = {
    id: newId(),
    title,
    subjectId: input.subjectId,
    status: input.status,
    tag: tagFromPriority(input.priority),
    dueDate: input.dueDate || undefined,
  };

  await mutate((tasks) => [...tasks, task]);
  return { ...task };
}

export async function updateTask(
  id: string,
  patch: Partial<TaskInput>,
): Promise<Task> {
  if (patch.title !== undefined && !patch.title.trim()) {
    throw new Error("Título obrigatório");
  }
  if (patch.subjectId !== undefined && !patch.subjectId) {
    throw new Error("Disciplina obrigatória");
  }
  if (patch.status !== undefined && !VALID_STATUS.has(patch.status)) {
    throw new Error("Coluna inválida");
  }

  let updated: Task | null = null;

  await mutate((tasks) =>
    tasks.map((task) => {
      if (task.id !== id) return task;
      const next: Task = {
        ...task,
        title:
          patch.title !== undefined ? patch.title.trim() : task.title,
        subjectId: patch.subjectId ?? task.subjectId,
        status: patch.status ?? task.status,
        tag:
          patch.priority !== undefined
            ? tagFromPriority(patch.priority)
            : task.tag,
        dueDate:
          patch.dueDate !== undefined
            ? patch.dueDate || undefined
            : task.dueDate,
      };
      updated = next;
      return next;
    }),
  );

  if (!updated) throw new Error("Tarefa não encontrada");
  return updated;
}

export async function deleteTask(id: string): Promise<void> {
  await mutate((tasks) => tasks.filter((t) => t.id !== id));
}

/** Atualiza status (DnD) e persiste. */
export async function setTaskStatus(
  taskId: string,
  status: TaskStatus,
): Promise<Task[]> {
  if (!VALID_STATUS.has(status)) {
    throw new Error("Coluna inválida");
  }
  return mutate((tasks) => moveTask(tasks, taskId, status));
}

/** Helper síncrono para UI otimista. */
export function moveTask(
  tasks: Task[],
  taskId: string,
  status: TaskStatus,
): Task[] {
  return tasks.map((task) =>
    task.id === taskId ? { ...task, status } : task,
  );
}
