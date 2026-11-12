import { Check, Clock, Pencil, Trash2 } from "lucide-react";
import type { Reminder } from "../../types";
import { PASTEL_BG } from "../../lib/colors";
import { formatReminderWhen } from "../../services/reminders";
import { cn } from "../../lib/utils";
import { StatusMessage } from "../ui/StatusMessage";

type ReminderListProps = {
  reminders: Reminder[];
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (reminder: Reminder) => void;
  /** Labels opcionais para exibir títulos em vez de ids */
  taskLabel?: (taskId: string) => string;
  eventLabel?: (eventId: string) => string;
};

export function ReminderList({
  reminders,
  onComplete,
  onDelete,
  onEdit,
  taskLabel,
  eventLabel,
}: ReminderListProps) {
  return (
    <section className="rounded-2xl border border-bloom-100 bg-surface p-5 shadow-sm">
      <h3 className="mb-4 text-base font-bold text-ink">Seus lembretes</h3>
      {reminders.length === 0 ? (
        <StatusMessage variant="empty">
          Nenhum lembrete ainda. Crie o primeiro.
        </StatusMessage>
      ) : (
        <ul className="space-y-3">
          {reminders.map((reminder) => (
            <li
              key={reminder.id}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3.5",
                PASTEL_BG[reminder.color],
                reminder.completed && "opacity-60",
              )}
            >
              <Clock className="h-4 w-4 shrink-0 text-ink/70" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-ink/70">
                  {formatReminderWhen(reminder.datetime)}
                </p>
                <p
                  className={cn(
                    "truncate text-sm font-semibold text-ink",
                    reminder.completed && "line-through",
                  )}
                >
                  {reminder.title}
                </p>
                {reminder.taskId || reminder.eventId ? (
                  <p className="mt-0.5 truncate text-[11px] text-ink/55">
                    {reminder.taskId
                      ? `Tarefa · ${taskLabel?.(reminder.taskId) ?? reminder.taskId}`
                      : null}
                    {reminder.taskId && reminder.eventId ? " · " : null}
                    {reminder.eventId
                      ? `Evento · ${eventLabel?.(reminder.eventId) ?? reminder.eventId}`
                      : null}
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => onComplete(reminder.id)}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full hover:bg-surface/70",
                    reminder.completed
                      ? "bg-emerald-500/20 text-emerald-700"
                      : "text-ink/70",
                  )}
                  aria-label={
                    reminder.completed
                      ? "Marcar como pendente"
                      : "Marcar como concluído"
                  }
                  title={
                    reminder.completed
                      ? "Marcar como pendente"
                      : "Marcar como concluído"
                  }
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(reminder)}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-ink/70 hover:bg-surface/70"
                  aria-label="Editar lembrete"
                  title="Editar"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(reminder.id)}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-ink/70 hover:bg-rose-100 hover:text-rose-700"
                  aria-label="Excluir lembrete"
                  title="Excluir"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
