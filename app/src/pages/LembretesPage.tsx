import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { FocusTimer } from "../components/lembretes/FocusTimer";
import { ReminderList } from "../components/lembretes/ReminderList";
import { RoutineCard } from "../components/lembretes/RoutineCard";
import { SimpleModal } from "../components/ui/SimpleModal";
import {
  getFocusSession,
  listReminders,
} from "../services/reminders";
import type { FocusSession, Reminder } from "../types";

export function LembretesPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [focus, setFocus] = useState<FocusSession | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    void listReminders().then(setReminders);
    void getFocusSession().then(setFocus);
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-ink">
          Lembretes e sessões de foco
        </h2>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-bloom-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-bloom-700"
        >
          <Plus className="h-4 w-4" />
          Novo lembrete
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(260px,1fr)]">
        <ReminderList reminders={reminders} />
        <div className="space-y-5">
          {focus ? (
            <FocusTimer
              durationMinutes={focus.durationMinutes}
              completedCycles={focus.completedCycles}
              targetCycles={focus.targetCycles}
            />
          ) : null}
          <RoutineCard />
        </div>
      </div>

      <SimpleModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Novo lembrete"
        description="Defina data, hora e o que você quer lembrar."
      >
        <div className="space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink">Título</span>
            <input
              type="text"
              placeholder="Ex.: Revisar integrais para a prova"
              className="w-full rounded-xl border border-bloom-200 bg-bloom-50/50 px-3 py-2.5 text-sm outline-none focus:border-bloom-400"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink">Quando</span>
            <input
              type="datetime-local"
              className="w-full rounded-xl border border-bloom-200 bg-bloom-50/50 px-3 py-2.5 text-sm outline-none focus:border-bloom-400"
            />
          </label>
        </div>
      </SimpleModal>
    </div>
  );
}
