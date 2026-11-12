import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { FormField } from "../components/ui/FormField";
import { formControlClassName } from "../components/ui/formStyles";
import { SimpleModal } from "../components/ui/SimpleModal";
import { SUBJECT_BG } from "../lib/subjectColors";
import { cn } from "../lib/utils";
import {
  COLOR_OPTIONS,
  createScheduleSlot,
  deleteScheduleSlot,
  findScheduleConflict,
  formatCurrentWeekBadge,
  listScheduleSlots,
  TIME_SLOTS,
  updateScheduleSlot,
  WEEK_DAYS,
  type ScheduleSlot,
  type WeekDay,
} from "../services/schedule";
import { useToastStore } from "../stores/toastStore";
import type { SubjectColor } from "../types";

type SlotForm = {
  title: string;
  room: string;
  dayOfWeek: string;
  startTime: string;
  color: SubjectColor;
};

const EMPTY_FORM: SlotForm = {
  title: "",
  room: "",
  dayOfWeek: "1",
  startTime: TIME_SLOTS[0] ?? "08:00",
  color: "lavender",
};

export function GradePage() {
  const showToast = useToastStore((s) => s.show);
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SlotForm>(EMPTY_FORM);
  const [deleting, setDeleting] = useState(false);
  const [weekBadge] = useState(() => formatCurrentWeekBadge());

  const refresh = async () => {
    setSlots(await listScheduleSlots());
  };

  useEffect(() => {
    let alive = true;
    listScheduleSlots().then((data) => {
      if (alive) setSlots(data);
    });
    return () => {
      alive = false;
    };
  }, []);

  const findSlot = (day: number, time: string) =>
    slots.find((s) => s.dayOfWeek === day && s.startTime === time);

  const openCreate = (day?: WeekDay, time?: string) => {
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      dayOfWeek: String(day ?? 1),
      startTime: time ?? EMPTY_FORM.startTime,
    });
    setModalOpen(true);
  };

  const openEdit = (slot: ScheduleSlot) => {
    setEditingId(slot.id);
    setForm({
      title: slot.title,
      room: slot.room,
      dayOfWeek: String(slot.dayOfWeek),
      startTime: slot.startTime,
      color: slot.color,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (deleting) return;
    setModalOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = async () => {
    const payload = {
      title: form.title,
      room: form.room,
      dayOfWeek: Number(form.dayOfWeek) as WeekDay,
      startTime: form.startTime,
      color: form.color,
    };
    if (editingId) {
      await updateScheduleSlot(editingId, payload);
      showToast("Aula atualizada");
    } else {
      await createScheduleSlot(payload);
      showToast("Aula adicionada");
    }
    await refresh();
  };

  const handleDelete = async () => {
    if (!editingId) return;
    const ok = window.confirm("Excluir esta aula da grade?");
    if (!ok) return;
    setDeleting(true);
    try {
      await deleteScheduleSlot(editingId);
      await refresh();
      setModalOpen(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      showToast("Aula removida");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Erro ao excluir");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 min-w-0 w-full max-w-full flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <h2 className="text-lg font-semibold text-ink">Minha grade semanal</h2>
          <span className="rounded-full bg-pastel-lavender px-3 py-1 text-xs font-medium text-bloom-700">
            {weekBadge}
          </span>
        </div>
        <button
          type="button"
          onClick={() => openCreate()}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-bloom-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-bloom-700"
        >
          <Plus className="h-4 w-4" />
          Personalizar
        </button>
      </div>

      {/* min-w-0: pai do shell tem overflow-x-hidden — sem isso o scroll horizontal some no mobile */}
      <div className="min-h-0 min-w-0 w-full max-w-full flex-1 overflow-x-auto overflow-y-auto overscroll-x-contain rounded-2xl border border-bloom-100/80 bg-surface p-2 shadow-sm [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] sm:p-4">
        <div
          className="grid min-w-[640px] gap-2 md:min-w-[720px]"
          style={{
            gridTemplateColumns: `64px repeat(${WEEK_DAYS.length}, minmax(0, 1fr))`,
          }}
        >
          <div className="px-2 py-2 text-xs font-semibold uppercase tracking-wide text-muted">
            Horário
          </div>
          {WEEK_DAYS.map((day) => (
            <div
              key={day.day}
              className="px-2 py-2 text-center text-sm font-semibold text-ink"
            >
              {day.label}
            </div>
          ))}

          {TIME_SLOTS.map((time) => (
            <div key={time} className="contents">
              <div className="flex items-start justify-end pr-2 pt-3 text-xs font-medium text-muted">
                {time}
              </div>
              {WEEK_DAYS.map((day) => {
                const slot = findSlot(day.day, time);
                return (
                  <div
                    key={`${day.day}-${time}`}
                    className="min-h-[72px] rounded-xl border border-bloom-50 bg-bloom-50/40 p-1"
                  >
                    {slot ? (
                      <button
                        type="button"
                        onClick={() => openEdit(slot)}
                        className={cn(
                          "flex h-full min-h-[64px] w-full flex-col justify-center rounded-xl px-3 py-2 text-left transition hover:ring-2 hover:ring-bloom-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bloom-400",
                          SUBJECT_BG[slot.color],
                        )}
                        aria-label={`Editar ${slot.title}`}
                      >
                        <p className="text-sm font-semibold leading-tight text-ink">
                          {slot.title}
                        </p>
                        <p className="mt-0.5 text-xs text-muted">
                          {slot.room || "Sem sala"}
                        </p>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openCreate(day.day, time)}
                        className="flex h-full min-h-[64px] w-full items-center justify-center rounded-xl text-xs font-medium text-muted/70 transition hover:bg-bloom-100/60 hover:text-bloom-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bloom-400"
                        aria-label={`Adicionar aula em ${day.label} às ${time}`}
                      >
                        <Plus className="h-4 w-4" aria-hidden />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-xs text-muted">
        Toque numa célula para criar ou editar • Cores por disciplina • Persistido
        neste dispositivo
      </p>

      <SimpleModal
        open={modalOpen}
        onClose={closeModal}
        onSave={handleSave}
        submitting={deleting ? true : undefined}
        title={editingId ? "Editar aula" : "Nova aula"}
        description="Adicione aulas, monitorias e compromissos na grade semanal."
        validate={() => {
          if (!form.title.trim()) return "Preencha o campo “Disciplina / título”.";
          if (!form.dayOfWeek) return "Escolha o dia.";
          if (!form.startTime) return "Escolha o horário.";
          const day = Number(form.dayOfWeek);
          if (day < 1 || day > 5) return "Dia inválido.";
          if (!TIME_SLOTS.includes(form.startTime)) return "Horário inválido.";
          const clash = findScheduleConflict(
            day as WeekDay,
            form.startTime,
            editingId ?? undefined,
          );
          if (clash) {
            return `Já existe aula neste horário (${clash.title})`;
          }
          return null;
        }}
      >
        <div className="space-y-3">
          <FormField label="Disciplina / título *">
            <input
              type="text"
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
              placeholder="Ex.: Cálculo 1"
              className={formControlClassName}
            />
          </FormField>

          <FormField label="Sala / local">
            <input
              type="text"
              value={form.room}
              onChange={(e) =>
                setForm((f) => ({ ...f, room: e.target.value }))
              }
              placeholder="Ex.: Lab 2"
              className={formControlClassName}
            />
          </FormField>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="Dia *">
              <select
                value={form.dayOfWeek}
                onChange={(e) =>
                  setForm((f) => ({ ...f, dayOfWeek: e.target.value }))
                }
                className={formControlClassName}
              >
                {WEEK_DAYS.map((d) => (
                  <option key={d.day} value={String(d.day)}>
                    {d.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Horário *">
              <select
                value={form.startTime}
                onChange={(e) =>
                  setForm((f) => ({ ...f, startTime: e.target.value }))
                }
                className={formControlClassName}
              >
                {TIME_SLOTS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

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
              {COLOR_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </FormField>

          {editingId ? (
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={deleting}
              className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              {deleting ? "Excluindo…" : "Excluir aula"}
            </button>
          ) : null}
        </div>
      </SimpleModal>
    </div>
  );
}
