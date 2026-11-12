import type { UpcomingEvent } from "../../services/calendar";
import { PASTEL_BG } from "../../lib/colors";
import { cn } from "../../lib/utils";

type UpcomingEventsProps = {
  events: UpcomingEvent[];
  onEventClick?: (eventId: string) => void;
};

export function UpcomingEvents({ events, onEventClick }: UpcomingEventsProps) {
  return (
    <aside className="min-w-0 overflow-hidden rounded-2xl border border-bloom-100 bg-surface p-5 shadow-sm">
      <h3 className="mb-4 text-base font-bold text-ink">Próximos eventos</h3>
      {events.length === 0 ? (
        <p className="text-sm text-muted">Nenhum evento próximo.</p>
      ) : (
        <ul className="space-y-2.5">
          {events.map((event) => (
            <li key={event.id}>
              <button
                type="button"
                onClick={() => onEventClick?.(event.id)}
                className={cn(
                  "w-full rounded-xl px-3.5 py-3 text-left transition hover:opacity-90",
                  PASTEL_BG[event.color],
                  onEventClick ? "cursor-pointer" : "cursor-default",
                )}
              >
                <p className="text-[10px] font-bold uppercase tracking-wide text-ink/60">
                  {event.dayLabel}
                </p>
                <p className="truncate text-sm font-semibold text-ink">
                  {event.title}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-5 text-xs text-muted">
        Filtros: provas · entregas · aulas
      </p>
    </aside>
  );
}
