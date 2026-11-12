import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useDraggable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { motion } from "motion/react";
import { Plus } from "lucide-react";
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
  listTasks,
  moveTask,
} from "../services/tasks";
import type { Task, TaskStatus } from "../types";
import { useToastStore } from "../stores/toastStore";

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
  return (
    <div
      className={cn(
        "rounded-2xl border border-bloom-100/60 bg-surface p-3.5 shadow-sm",
        dragging && "opacity-90 shadow-md ring-2 ring-bloom-300",
      )}
    >
      <p className="text-sm font-semibold text-ink">{task.title}</p>
      <p className="mt-1 text-xs text-muted">{subjectLabel}</p>
      <span
        className={cn(
          "mt-3 inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium",
          tagClass,
        )}
      >
        {task.tag}
      </span>
    </div>
  );
}

function DraggableTask({
  task,
  subjectLabel,
  tagClass,
}: {
  task: Task;
  subjectLabel: string;
  tagClass: string;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { status: task.status, type: "task" },
  });

  // Transform fica no DragOverlay — aplicar aqui + overlay gera “fantasma duplo”
  return (
    <li
      ref={setNodeRef}
      className={cn(isDragging && "opacity-30")}
    >
      <button
        type="button"
        className="w-full cursor-grab text-left active:cursor-grabbing focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bloom-500"
        {...listeners}
        {...attributes}
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
}: {
  status: TaskStatus;
  title: string;
  accent: string;
  tagClass: string;
  tasks: Task[];
  subjectName: (id: string) => string;
  onAdd: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
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
  const showToast = useToastStore((s) => s.show);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
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

  const subjectName = useMemo(() => {
    const map = new Map(subjects.map((s) => [s.id, s.name]));
    return (id: string) => {
      if (id === "redes") return "Redes";
      if (id === "bd") return "Banco de Dados";
      if (id === "es") return "Engenharia de Software";
      if (id === "algoritmos") return "Algoritmos";
      return map.get(id) ?? id;
    };
  }, [subjects]);

  const activeTask = activeId
    ? tasks.find((t) => t.id === activeId) ?? null
    : null;
  const activeColumn = activeTask
    ? KANBAN_COLUMNS.find((c) => c.status === activeTask.status)
    : null;

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
    // Soltou em cima de outro card → usa a coluna desse card
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
    if (String(active.id) === String(over.id)) return;
    setTasks((prev) => moveTask(prev, String(active.id), nextStatus));
  };

  const addToast = () =>
    showToast("Nova tarefa chega em breve — formulário em construção");

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-ink">Quadro de atividades</h2>
        <div className="flex flex-wrap items-center gap-2">
          <motion.button
            type="button"
            onClick={() =>
              showToast("Filtro por disciplina chega em breve")
            }
            className="min-h-11 rounded-xl bg-pastel-lavender px-3 py-2 text-sm font-medium text-bloom-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bloom-500"
            {...press}
          >
            Todas as disciplinas
          </motion.button>
          <motion.button
            type="button"
            onClick={addToast}
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
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDragCancel={() => setActiveId(null)}
        >
          <motion.div
            className="flex min-h-0 flex-1 gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:thin] lg:grid lg:grid-cols-4 lg:overflow-x-visible lg:pb-0"
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
                  tasks={tasks.filter((t) => t.status === column.status)}
                  subjectName={subjectName}
                  onAdd={addToast}
                />
              </motion.div>
            ))}
          </motion.div>

          <DragOverlay>
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
    </div>
  );
}

