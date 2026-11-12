import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { MonthCalendar } from "../components/calendario/MonthCalendar";
import { UpcomingEvents } from "../components/calendario/UpcomingEvents";
import { SimpleModal } from "../components/ui/SimpleModal";
import {
  listCalendarEvents,
  listUpcomingEvents,
  type UpcomingEvent,
} from "../services/calendar";
import type { CalendarEvent } from "../types";

export function CalendarioPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [upcoming, setUpcoming] = useState<UpcomingEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(() => new Date(2026, 10, 11));
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    void listCalendarEvents().then(setEvents);
    void listUpcomingEvents().then(setUpcoming);
  }, []);

  const shiftMonth = (delta: number) => {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + delta, 1));
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-bloom-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-bloom-700"
        >
          <Plus className="h-4 w-4" />
          Novo evento
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.8fr)_minmax(240px,1fr)]">
        <MonthCalendar
          events={events}
          currentDate={currentDate}
          onPrev={() => shiftMonth(-1)}
          onNext={() => shiftMonth(1)}
          onToday={() => setCurrentDate(new Date(2026, 10, 11))}
        />
        <UpcomingEvents events={upcoming} />
      </div>

      <SimpleModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Novo evento"
        description="Marque provas, entregas e compromissos do semestre."
      >
        <div className="space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink">Título</span>
            <input
              type="text"
              placeholder="Ex.: Prova Cálculo 1"
              className="w-full rounded-xl border border-bloom-200 bg-bloom-50/50 px-3 py-2.5 text-sm outline-none focus:border-bloom-400"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink">Data</span>
            <input
              type="date"
              className="w-full rounded-xl border border-bloom-200 bg-bloom-50/50 px-3 py-2.5 text-sm outline-none focus:border-bloom-400"
            />
          </label>
        </div>
      </SimpleModal>
    </div>
  );
}
