/**
 * Service de tarefas (Kanban) — mock do Figma tela 02.
 */

import type { Task, TaskStatus } from "../types";

const MOCK_TASKS: Task[] = [
  {
    id: "t1",
    title: "Lista de integrais",
    subjectId: "calc-1",
    status: "todo",
    tag: "Alta prioridade",
  },
  {
    id: "t2",
    title: "Estudar sub-redes",
    subjectId: "redes",
    status: "todo",
    tag: "Média prioridade",
  },
  {
    id: "t3",
    title: "Modelar banco",
    subjectId: "bd",
    status: "todo",
    tag: "Até sexta",
  },
  {
    id: "t4",
    title: "Projeto de Python",
    subjectId: "algoritmos",
    status: "doing",
    tag: "Em progresso",
  },
  {
    id: "t5",
    title: "Resumo de SQL",
    subjectId: "bd",
    status: "doing",
    tag: "Esta semana",
  },
  {
    id: "t6",
    title: "Slides de Redes",
    subjectId: "redes",
    status: "review",
    tag: "Revisão",
  },
  {
    id: "t7",
    title: "Exercícios de limites",
    subjectId: "calc-1",
    status: "review",
    tag: "Conferir",
  },
  {
    id: "t8",
    title: "Quiz de derivadas",
    subjectId: "calc-1",
    status: "done",
    tag: "Finalizado",
  },
  {
    id: "t9",
    title: "Configurar Git",
    subjectId: "es",
    status: "done",
    tag: "Finalizado",
  },
  {
    id: "t10",
    title: "Leitura de RFC",
    subjectId: "redes",
    status: "done",
    tag: "Finalizado",
  },
  {
    id: "t11",
    title: "Lista de funções",
    subjectId: "calc-1",
    status: "done",
    tag: "Finalizado",
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

export async function listTasks(): Promise<Task[]> {
  return MOCK_TASKS.map((t) => ({ ...t }));
}

export function moveTask(
  tasks: Task[],
  taskId: string,
  status: TaskStatus,
): Task[] {
  return tasks.map((task) =>
    task.id === taskId ? { ...task, status } : task,
  );
}
