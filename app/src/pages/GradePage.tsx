import { useEffect, useState } from "react";
import { SimpleModal } from "../components/ui/SimpleModal";
import { SUBJECT_BG } from "../lib/subjectColors";
import { cn } from "../lib/utils";
import {
  listScheduleSlots,
  TIME_SLOTS,
  WEEK_DAYS,
  type ScheduleSlot,
} from "../services/schedule";

export function GradePage() {
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

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

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-semibold text-ink">Minha grade semanal</h2>
          <span className="rounded-full bg-pastel-lavender px-3 py-1 text-xs font-medium text-bloom-700">
            Semana 09–13 nov
          </span>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="min-h-11 rounded-xl bg-bloom-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-bloom-700"
        >
          Personalizar
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto rounded-2xl border border-bloom-100/80 bg-surface p-2 shadow-sm sm:p-4">
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
                      <div
                        className={cn(
                          "flex h-full min-h-[64px] flex-col justify-center rounded-xl px-3 py-2",
                          SUBJECT_BG[slot.color],
                        )}
                      >
                        <p className="text-sm font-semibold leading-tight text-ink">
                          {slot.title}
                        </p>
                        <p className="mt-0.5 text-xs text-muted">{slot.room}</p>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-xs text-muted">
        Cores por disciplina • Horários editáveis • Inclua aulas, monitorias e
        compromissos
      </p>

      <SimpleModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Personalizar grade"
        description="Adicione aulas, monitorias e compromissos — edição completa em breve."
      >
        <div className="space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink">Disciplina / título</span>
            <input
              type="text"
              placeholder="Ex.: Cálculo 1"
              className="w-full rounded-xl border border-bloom-200 bg-bloom-50/50 px-3 py-2.5 text-sm outline-none focus:border-bloom-400"
            />
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-ink">Dia</span>
              <select className="w-full rounded-xl border border-bloom-200 bg-bloom-50/50 px-3 py-2.5 text-sm outline-none focus:border-bloom-400">
                {WEEK_DAYS.map((d) => (
                  <option key={d.day}>{d.label}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-ink">Horário</span>
              <select className="w-full rounded-xl border border-bloom-200 bg-bloom-50/50 px-3 py-2.5 text-sm outline-none focus:border-bloom-400">
                {TIME_SLOTS.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </SimpleModal>
    </div>
  );
}
