import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useDroppable,
  useDraggable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { motion } from "motion/react";
import { Plus, Trash2 } from "lucide-react";
import { SimpleModal } from "../components/ui/SimpleModal";
import { StatusMessage } from "../components/ui/StatusMessage";
import { useSubjects } from "../hooks/useSubjects";
import {
  getStaggerContainer,
  getStaggerItem,
  pressable,
  pressableReduced,
  useReducedMotionPreference,
} from "../lib/motion";
import { cn } from "../lib/utils";
import {
  KANBAN_COLUMNS,
  PRIORITY_OPTIONS,
  createTask,
  deleteTask,
  formatDueLabel,
  listTasks,
  moveTask,
  priorityFromTag,
  setTaskStatus,
  updateTask,
  type TaskPriority,
} from "../services/tasks";
import type { Task, TaskStatus } from "../types";
import { useToastStore } from "../stores/toastStore";

type TaskDraft = {
  title: string;
  subjectId: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
};

const emptyDraft = (status: TaskStatus, subjectId = ""): TaskDraft => ({
  title: "",
  subjectId,
  status,
  priority: "media",
  dueDate: "",
});

/** Prefere o alvo sob o ponteiro (card/coluna); fallback geométrico. */
const kanbanCollision: CollisionDetection = (args) => {
  const pointerHits = pointerWithin(args);
  if (pointerHits.length > 0) return pointerHits;
  return rectIntersection(args);
};

function TaskCard({
  task,
  subjectLabel,
  tagClass,
  dragging,
}: {
  task: Task;
  subjectLabel: string;
  tagClass: string;
  dragging?: boolean;
}) {
  const due = formatDueLabel(task.dueDate);

  return (
    <div
      className={cn(
        "rounded-2xl border border-bloom-100/60 bg-surface p-3.5 shadow-sm",
        dragging && "opacity-90 shadow-md ring-2 ring-bloom-300",
      )}
    >
      <p className="text-sm font-semibold text-ink">{task.title}</p>
      <p className="mt-1 text-xs text-muted">{subjectLabel}</p>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span
          className={cn(
            "inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium",
            tagClass,
          )}
        >
          {task.tag}
        </span>
        {due ? (
          <span className="inline-flex rounded-full bg-bloom-50 px-2.5 py-1 text-[11px] font-medium text-muted">
            {due}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function DraggableTask({
  task,
  subjectLabel,
  tagClass,
  onEdit,
}: {
  task: Task;
  subjectLabel: string;
  tagClass: string;
  onEdit: (task: Task) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    isDragging,
  } = useDraggable({
    id: task.id,
    data: { status: task.status, type: "task" },
  });
  // Card também é droppable: soltar em cima de outro card resolve a coluna
  const { setNodeRef: setDropRef } = useDroppable({
    id: task.id,
    data: { status: task.status, type: "task" },
  });
  const setNodeRef = (node: HTMLElement | null) => {
    setDragRef(node);
    setDropRef(node);
  };

  // Clique vs drag: PointerSensor (distance) já bloqueia o click pós-drag.
  // Flag manual engolia o *próximo* clique legítimo (dnd-kit não dispara o click).
  // Sem transform no item + overlay = sem fantasma duplo; fonte some no drag
  return (
    <li ref={setNodeRef} className={cn(isDragging && "opacity-0")}>
      <button
        type="button"
        className="w-full cursor-grab text-left active:cursor-grabbing focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bloom-500"
        {...listeners}
        {...attributes}
        onClick={() => onEdit(task)}
      >
        <TaskCard
          task={task}
          subjectLabel={subjectLabel}
          tagClass={tagClass}
        />
      </button>
    </li>
  );
}

function Column({
  status,
  title,
  accent,
  tagClass,
  tasks,
  subjectName,
  onAdd,
  onEdit,
}: {
  status: TaskStatus;
  title: string;
  accent: string;
  tagClass: string;
  tasks: Task[];
  subjectName: (id: string) => string;
  onAdd: () => void;
  onEdit: (task: Task) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: { status, type: "column" },
  });
  const count = String(tasks.length).padStart(2, "0");

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex min-h-[280px] flex-col rounded-2xl bg-bloom-50/80 p-3 transition",
        isOver && "bg-bloom-100/90 ring-2 ring-bloom-300/60",
      )}
    >
      <div className="mb-3 flex items-center gap-2 px-1">
        <span className={cn("h-4 w-1 rounded-full", accent)} aria-hidden />
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-muted shadow-sm">
          {count}
        </span>
      </div>

      <ul className="flex flex-1 flex-col gap-2.5">
        {tasks.length === 0 ? (
          <li className="px-1 py-2">
            <StatusMessage variant="empty">Arraste uma tarefa</StatusMessage>
          </li>
        ) : (
          tasks.map((task) => (
            <DraggableTask
              key={task.id}
              task={task}
              subjectLabel={subjectName(task.subjectId)}
              tagClass={tagClass}
              onEdit={onEdit}
            />
          ))
        )}
      </ul>

      <button
        type="button"
        onClick={onAdd}
        className="mt-3 flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-bloom-200 py-2.5 text-sm font-medium text-muted hover:border-bloom-300 hover:bg-surface/70 hover:text-bloom-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bloom-500"
      >
        <Plus className="h-3.5 w-3.5" />
        Adicionar tarefa
      </button>
    </section>
  );
}

export function KanbanPage() {
  const reduced = useReducedMotionPreference();
  const stagger = getStaggerContainer(reduced);
  const item = getStaggerItem(reduced);
  const press = reduced ? pressableReduced : pressable;
  const { subjects } = useSubjects();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<TaskDraft>(emptyDraft("todo"));
  const [deleting, setDeleting] = useState(false);
  const showToast = useToastStore((s) => s.show);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  useEffect(() => {
    let alive = true;
    listTasks().then((data) => {
      if (alive) {
        setTasks(data);
        setLoading(false);
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  // Filtro órfão (disciplina removida) → volta para "todas"
  useEffect(() => {
    if (subjectFilter === "all") return;
    if (!subjects.some((s) => s.id === subjectFilter)) {
      setSubjectFilter("all");
    }
  }, [subjects, subjectFilter]);

  const subjectName = useMemo(() => {
    const map = new Map(subjects.map((s) => [s.id, s.name]));
    return (id: string) => map.get(id) ?? id;
  }, [subjects]);

  const defaultSubjectId = subjects[0]?.id ?? "";
  const draftSubjectId =
    subjectFilter !== "all" && subjects.some((s) => s.id === subjectFilter)
      ? subjectFilter
      : defaultSubjectId;

  // Modal aberto antes das disciplinas carregarem → preenche subjectId
  useEffect(() => {
    if (!modalOpen || editingId || draft.subjectId || !draftSubjectId) return;
    setDraft((d) => (d.subjectId ? d : { ...d, subjectId: draftSubjectId }));
  }, [modalOpen, editingId, draft.subjectId, draftSubjectId]);

  const visibleTasks = useMemo(() => {
    if (subjectFilter === "all") return tasks;
    return tasks.filter((t) => t.subjectId === subjectFilter);
  }, [tasks, subjectFilter]);

  const activeTask = activeId
    ? tasks.find((t) => t.id === activeId) ?? null
    : null;
  const activeColumn = activeTask
    ? KANBAN_COLUMNS.find((c) => c.status === activeTask.status)
    : null;

  const openCreate = (status: TaskStatus) => {
    setEditingId(null);
    setDraft(emptyDraft(status, draftSubjectId));
    setModalOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditingId(task.id);
    setDraft({
      title: task.title,
      subjectId: task.subjectId,
      status: task.status,
      priority: priorityFromTag(task.tag),
      dueDate: task.dueDate ?? "",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (deleting) return;
    setModalOpen(false);
    setEditingId(null);
  };

  const validateDraft = (): string | null => {
    if (!draft.title.trim()) return "Informe um título para a tarefa";
    if (!draft.subjectId) return "Escolha uma disciplina";
    if (!subjects.some((s) => s.id === draft.subjectId)) {
      return "Disciplina inválida — escolha outra";
    }
    return null;
  };

  const onSubmit = async () => {
    const err = validateDraft();
    if (err) throw new Error(err);

    if (editingId) {
      await updateTask(editingId, {
        title: draft.title,
        subjectId: draft.subjectId,
        status: draft.status,
        priority: draft.priority,
        dueDate: draft.dueDate,
      });
      showToast("Tarefa atualizada");
    } else {
      await createTask({
        title: draft.title,
        subjectId: draft.subjectId,
        status: draft.status,
        priority: draft.priority,
        dueDate: draft.dueDate || undefined,
      });
      showToast("Tarefa criada");
    }
    setTasks(await listTasks());
    setEditingId(null);
  };

  const onDelete = async () => {
    if (!editingId) return;
    setDeleting(true);
    try {
      await deleteTask(editingId);
      setTasks(await listTasks());
      setModalOpen(false);
      setEditingId(null);
      showToast("Tarefa removida");
    } catch {
      showToast("Não foi possível remover a tarefa");
    } finally {
      setDeleting(false);
    }
  };

  const onDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const resolveDropStatus = (
    overId: string,
    overData: Record<string, unknown> | undefined,
  ): TaskStatus | null => {
    if (KANBAN_COLUMNS.some((c) => c.status === overId)) {
      return overId as TaskStatus;
    }
    const fromData = overData?.status;
    if (
      typeof fromData === "string" &&
      KANBAN_COLUMNS.some((c) => c.status === fromData)
    ) {
      return fromData as TaskStatus;
    }
    const overTask = tasks.find((t) => t.id === overId);
    return overTask?.status ?? null;
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const nextStatus = resolveDropStatus(
      String(over.id),
      over.data.current as Record<string, unknown> | undefined,
    );
    if (!nextStatus) return;

    const taskId = String(active.id);
    const current = tasks.find((t) => t.id === taskId);
    if (!current || current.status === nextStatus) return;

    const fromStatus = current.status;
    setTasks((prev) => moveTask(prev, taskId, nextStatus));

    void setTaskStatus(taskId, nextStatus).catch(() => {
      // Reverte só este card — snapshot global apagaria outros moves otimistas
      setTasks((prev) => moveTask(prev, taskId, fromStatus));
      showToast("Não foi possível mover a tarefa");
    });
  };

  return (
    <div className="flex h-full min-h-0 min-w-0 w-full max-w-full flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-ink">Quadro de atividades</h2>
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="kanban-subject-filter">
            Filtrar por disciplina
          </label>
          <select
            id="kanban-subject-filter"
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="min-h-11 rounded-xl bg-pastel-lavender px-3 py-2 text-sm font-medium text-bloom-700 outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bloom-500"
          >
            <option value="all">Todas as disciplinas</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <motion.button
            type="button"
            onClick={() => openCreate("todo")}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-bloom-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-bloom-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bloom-500"
            {...press}
          >
            <Plus className="h-4 w-4" />
            Nova tarefa
          </motion.button>
        </div>
      </div>

      {loading ? (
        <StatusMessage>Carregando quadro…</StatusMessage>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={kanbanCollision}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDragCancel={() => setActiveId(null)}
        >
          {/* min-w-0: pai tem overflow-x-hidden — sem isso o scroll mobile some */}
          <motion.div
            className="flex min-h-0 min-w-0 w-full max-w-full flex-1 gap-4 overflow-x-auto overscroll-x-contain pb-2 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] lg:grid lg:grid-cols-4 lg:overflow-x-visible lg:pb-0"
            variants={stagger}
            initial="initial"
            animate="animate"
          >
            {KANBAN_COLUMNS.map((column) => (
              <motion.div
                key={column.status}
                variants={item}
                className="w-[min(280px,82vw)] shrink-0 min-h-0 lg:w-auto lg:min-w-0"
              >
                <Column
                  status={column.status}
                  title={column.title}
                  accent={column.accent}
                  tagClass={column.tagClass}
                  tasks={visibleTasks.filter((t) => t.status === column.status)}
                  subjectName={subjectName}
                  onAdd={() => openCreate(column.status)}
                  onEdit={openEdit}
                />
              </motion.div>
            ))}
          </motion.div>

          <DragOverlay dropAnimation={null}>
            {activeTask && activeColumn ? (
              <TaskCard
                task={activeTask}
                subjectLabel={subjectName(activeTask.subjectId)}
                tagClass={activeColumn.tagClass}
                dragging
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <SimpleModal
        open={modalOpen}
        onClose={closeModal}
        onSubmit={onSubmit}
        validate={validateDraft}
        submitLabel="Salvar"
        submitDisabled={subjects.length === 0}
        submitting={deleting ? true : undefined}
        title={editingId ? "Editar tarefa" : "Nova tarefa"}
        description="Título, disciplina, prioridade e prazo — salvos no store local."
      >
        <div className="space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink">Título</span>
            <input
              type="text"
              value={draft.title}
              onChange={(e) =>
                setDraft((d) => ({ ...d, title: e.target.value }))
              }
              placeholder="Ex.: Revisar sub-redes"
              className="w-full rounded-xl border border-bloom-200 bg-bloom-50/50 px-3 py-2.5 text-sm outline-none focus:border-bloom-400"
              autoFocus
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink">Disciplina</span>
            <select
              value={draft.subjectId}
              onChange={(e) =>
                setDraft((d) => ({ ...d, subjectId: e.target.value }))
              }
              className="w-full rounded-xl border border-bloom-200 bg-bloom-50/50 px-3 py-2.5 text-sm outline-none focus:border-bloom-400"
            >
              {subjects.length === 0 ? (
                <option value="">Sem disciplinas</option>
              ) : (
                subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))
              )}
            </select>
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-ink">Prioridade</span>
              <select
                value={draft.priority}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    priority: e.target.value as TaskPriority,
                  }))
                }
                className="w-full rounded-xl border border-bloom-200 bg-bloom-50/50 px-3 py-2.5 text-sm outline-none focus:border-bloom-400"
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="mb-1 block font-medium text-ink">Prazo</span>
              <input
                type="date"
                value={draft.dueDate}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, dueDate: e.target.value }))
                }
                className="w-full rounded-xl border border-bloom-200 bg-bloom-50/50 px-3 py-2.5 text-sm outline-none focus:border-bloom-400"
              />
            </label>
          </div>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink">Coluna</span>
            <select
              value={draft.status}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  status: e.target.value as TaskStatus,
                }))
              }
              className="w-full rounded-xl border border-bloom-200 bg-bloom-50/50 px-3 py-2.5 text-sm outline-none focus:border-bloom-400"
            >
              {KANBAN_COLUMNS.map((c) => (
                <option key={c.status} value={c.status}>
                  {c.title}
                </option>
              ))}
            </select>
          </label>

          {editingId ? (
            <button
              type="button"
              onClick={() => void onDelete()}
              disabled={deleting}
              className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              {deleting ? "Excluindo…" : "Excluir tarefa"}
            </button>
          ) : null}
        </div>
      </SimpleModal>
    </div>
  );
}
