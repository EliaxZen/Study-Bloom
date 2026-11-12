import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { FocusTimer } from "../components/lembretes/FocusTimer";
import { ReminderList } from "../components/lembretes/ReminderList";
import { RoutineCard } from "../components/lembretes/RoutineCard";
import { FormField } from "../components/ui/FormField";
import { SimpleModal } from "../components/ui/SimpleModal";
import { formControlClassName } from "../components/ui/formStyles";
import { StatusMessage } from "../components/ui/StatusMessage";
import { listCalendarEvents } from "../services/calendar";
import {
  completeReminder,
  createReminder,
  deleteReminder,
  getFocusSession,
  listReminders,
  toDatetimeLocalValue,
  updateReminder,
} from "../services/reminders";
import { listTasks } from "../services/tasks";
import { useToastStore } from "../stores/toastStore";
import type { CalendarEvent, FocusSession, Reminder, Task } from "../types";

type FormState = {
  title: string;
  datetime: string;
  taskId: string;
  eventId: string;
};

const EMPTY_FORM: FormState = {
  title: "",
  datetime: "",
  taskId: "",
  eventId: "",
};

export function LembretesPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [focus, setFocus] = useState<FocusSession | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const showToast = useToastStore((s) => s.show);

  const refresh = async () => {
    const data = await listReminders();
    setReminders(data);
  };

  useEffect(() => {
    let alive = true;
    void (async () => {
      const [rems, foc, tks, evs] = await Promise.all([
        listReminders(),
        getFocusSession(),
        listTasks(),
        listCalendarEvents(),
      ]);
      if (!alive) return;
      setReminders(rems);
      setFocus(foc);
      setTasks(tks);
      setEvents(evs);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (reminder: Reminder) => {
    setEditingId(reminder.id);
    setForm({
      title: reminder.title,
      datetime: toDatetimeLocalValue(reminder.datetime),
      taskId: reminder.taskId ?? "",
      eventId: reminder.eventId ?? "",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = async () => {
    const payload = {
      title: form.title,
      datetime: form.datetime,
      taskId: form.taskId || undefined,
      eventId: form.eventId || undefined,
    };
    if (editingId) {
      await updateReminder(editingId, {
        ...payload,
        taskId: form.taskId,
        eventId: form.eventId,
      });
      showToast("Lembrete atualizado");
    } else {
      await createReminder(payload);
      showToast("Lembrete criado");
    }
    await refresh();
  };

  const handleComplete = async (id: string) => {
    try {
      await completeReminder(id);
      await refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Erro ao concluir");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteReminder(id);
      await refresh();
      showToast("Lembrete excluído");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Erro ao excluir");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-ink">
          Lembretes e sessões de foco
        </h2>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-bloom-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-bloom-700"
        >
          <Plus className="h-4 w-4" />
          Novo lembrete
        </button>
      </div>

      {loading ? (
        <StatusMessage>Carregando lembretes…</StatusMessage>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(260px,1fr)]">
          <ReminderList
            reminders={reminders}
            onComplete={handleComplete}
            onDelete={handleDelete}
            onEdit={openEdit}
            taskLabel={(id) => tasks.find((t) => t.id === id)?.title ?? id}
            eventLabel={(id) => events.find((e) => e.id === id)?.title ?? id}
          />
          <div className="space-y-5">
            <FocusTimer
              durationMinutes={focus?.durationMinutes ?? 25}
              completedCycles={focus?.completedCycles ?? 0}
              targetCycles={focus?.targetCycles ?? 4}
            />
            <RoutineCard />
          </div>
        </div>
      )}

      <SimpleModal
        open={modalOpen}
        onClose={closeModal}
        onSave={handleSave}
        validate={() => {
          if (!form.title.trim()) return "Informe o título do lembrete.";
          if (!form.datetime) return "Informe data e hora.";
          return null;
        }}
        title={editingId ? "Editar lembrete" : "Novo lembrete"}
        description="Defina data, hora e o que você quer lembrar. Vínculos com tarefa ou evento são opcionais."
      >
        <div className="space-y-3">
          <FormField label="Título">
            <input
              type="text"
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
              placeholder="Ex.: Revisar integrais para a prova"
              className={formControlClassName}
            />
          </FormField>
          <FormField label="Quando">
            <input
              type="datetime-local"
              value={form.datetime}
              onChange={(e) =>
                setForm((f) => ({ ...f, datetime: e.target.value }))
              }
              className={formControlClassName}
            />
          </FormField>
          <FormField label="Tarefa (opcional)">
            <select
              value={form.taskId}
              onChange={(e) =>
                setForm((f) => ({ ...f, taskId: e.target.value }))
              }
              className={formControlClassName}
            >
              <option value="">Nenhuma</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Evento (opcional)">
            <select
              value={form.eventId}
              onChange={(e) =>
                setForm((f) => ({ ...f, eventId: e.target.value }))
              }
              className={formControlClassName}
            >
              <option value="">Nenhum</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title}
                </option>
              ))}
            </select>
          </FormField>
        </div>
      </SimpleModal>
    </div>
  );
}
