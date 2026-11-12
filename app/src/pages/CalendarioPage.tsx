import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { MonthCalendar } from "../components/calendario/MonthCalendar";
import { UpcomingEvents } from "../components/calendario/UpcomingEvents";
import { FormField } from "../components/ui/FormField";
import { formControlClassName } from "../components/ui/formStyles";
import { SimpleModal } from "../components/ui/SimpleModal";
import {
  ALERT_MINUTE_OPTIONS,
  createCalendarEvent,
  deleteCalendarEvent,
  EVENT_COLOR_OPTIONS,
  EVENT_TYPE_OPTIONS,
  getCalendarEvent,
  listCalendarEvents,
  listUpcomingEvents,
  toLocalIsoDate,
  updateCalendarEvent,
  type UpcomingEvent,
} from "../services/calendar";
import { useToastStore } from "../stores/toastStore";
import type { CalendarEvent, CalendarEventType, SubjectColor } from "../types";

type EventForm = {
  title: string;
  date: string;
  type: CalendarEventType;
  color: SubjectColor;
  alertEnabled: boolean;
  alertMinutesBefore: string;
};

function emptyForm(date = toLocalIsoDate()): EventForm {
  return {
    title: "",
    date,
    type: "outro",
    color: "lavender",
    alertEnabled: true,
    alertMinutesBefore: "1440",
  };
}

export function CalendarioPage() {
  const showToast = useToastStore((s) => s.show);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [upcoming, setUpcoming] = useState<UpcomingEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EventForm>(() => emptyForm());
  const [deleting, setDeleting] = useState(false);

  const refresh = async () => {
    setEvents(await listCalendarEvents());
    setUpcoming(await listUpcomingEvents());
  };

  useEffect(() => {
    let alive = true;
    void (async () => {
      const [all, next] = await Promise.all([
        listCalendarEvents(),
        listUpcomingEvents(),
      ]);
      if (!alive) return;
      setEvents(all);
      setUpcoming(next);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const shiftMonth = (delta: number) => {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + delta, 1));
  };

  const openCreate = (dateStr?: string) => {
    setEditingId(null);
    setForm(emptyForm(dateStr ?? toLocalIsoDate()));
    setModalOpen(true);
  };

  const openEdit = async (eventId: string) => {
    const event = await getCalendarEvent(eventId);
    if (!event) {
      showToast("Evento não encontrado");
      return;
    }
    setEditingId(event.id);
    setForm({
      title: event.title,
      date: event.date,
      type: event.type,
      color: event.color,
      alertEnabled: Boolean(event.alertEnabled),
      alertMinutesBefore: String(event.alertMinutesBefore ?? 1440),
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (deleting) return;
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm());
  };

  const handleSave = async () => {
    const payload = {
      title: form.title,
      date: form.date,
      type: form.type,
      color: form.color,
      alertEnabled: form.alertEnabled,
      alertMinutesBefore: Number(form.alertMinutesBefore) || 0,
    };
    if (editingId) {
      await updateCalendarEvent(editingId, payload);
      showToast("Evento atualizado");
    } else {
      await createCalendarEvent(payload);
      showToast("Evento criado");
    }
    await refresh();
  };

  const handleDelete = async () => {
    if (!editingId) return;
    const ok = window.confirm("Excluir este evento?");
    if (!ok) return;
    setDeleting(true);
    try {
      await deleteCalendarEvent(editingId);
      await refresh();
      setModalOpen(false);
      setEditingId(null);
      setForm(emptyForm());
      showToast("Evento excluído");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Erro ao excluir");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => openCreate()}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-bloom-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-bloom-700"
        >
          <Plus className="h-4 w-4" />
          Novo evento
        </button>
      </div>

      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.8fr)_minmax(240px,1fr)]">
        <MonthCalendar
          events={events}
          currentDate={currentDate}
          onPrev={() => shiftMonth(-1)}
          onNext={() => shiftMonth(1)}
          onToday={() => setCurrentDate(new Date())}
          onDateClick={(dateStr) => openCreate(dateStr)}
          onEventClick={(eventId) => void openEdit(eventId)}
        />
        <UpcomingEvents
          events={upcoming}
          onEventClick={(eventId) => void openEdit(eventId)}
        />
      </div>

      <SimpleModal
        open={modalOpen}
        onClose={closeModal}
        onSave={handleSave}
        submitting={deleting ? true : undefined}
        title={editingId ? "Editar evento" : "Novo evento"}
        description="Marque provas, entregas e compromissos do semestre."
        validate={() => {
          if (!form.title.trim()) return "Preencha o campo “Título”.";
          if (!form.date.trim()) return "Preencha o campo “Data”.";
          if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date.trim())) {
            return "Use uma data válida.";
          }
          return null;
        }}
      >
        <div className="space-y-3">
          <FormField label="Título *">
            <input
              type="text"
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
              placeholder="Ex.: Prova Cálculo 1"
              className={formControlClassName}
            />
          </FormField>

          <FormField label="Data *">
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className={formControlClassName}
            />
          </FormField>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="Tipo">
              <select
                value={form.type}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    type: e.target.value as CalendarEventType,
                  }))
                }
                className={formControlClassName}
              >
                {EVENT_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Cor">
              <select
                value={form.color}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    color: e.target.value as SubjectColor,
                  }))
                }
                className={formControlClassName}
              >
                {EVENT_COLOR_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <label className="flex min-h-11 items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={form.alertEnabled}
              onChange={(e) =>
                setForm((f) => ({ ...f, alertEnabled: e.target.checked }))
              }
              className="h-4 w-4 rounded border-bloom-300 text-bloom-600"
            />
            Ativar alerta
          </label>

          {form.alertEnabled ? (
            <FormField label="Antecedência do alerta">
              <select
                value={form.alertMinutesBefore}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    alertMinutesBefore: e.target.value,
                  }))
                }
                className={formControlClassName}
              >
                {ALERT_MINUTE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={String(opt.value)}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </FormField>
          ) : null}

          {editingId ? (
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={deleting}
              className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              {deleting ? "Excluindo…" : "Excluir evento"}
            </button>
          ) : null}
        </div>
      </SimpleModal>
    </div>
  );
}
