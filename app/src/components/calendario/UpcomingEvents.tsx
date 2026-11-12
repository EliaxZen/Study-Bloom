import type { UpcomingEvent } from "../../services/calendar";
import { PASTEL_BG } from "../../lib/colors";
import { cn } from "../../lib/utils";

type UpcomingEventsProps = {
  events: UpcomingEvent[];
};

export function UpcomingEvents({ events }: UpcomingEventsProps) {
  return (
    <aside className="rounded-2xl border border-bloom-100 bg-surface p-5 shadow-sm">
      <h3 className="mb-4 text-base font-bold text-ink">Próximos eventos</h3>
      <ul className="space-y-2.5">
        {events.map((event) => (
          <li
            key={event.id}
            className={cn(
              "rounded-xl px-3.5 py-3",
              PASTEL_BG[event.color],
            )}
          >
            <p className="text-[10px] font-bold uppercase tracking-wide text-ink/60">
              {event.dayLabel}
            </p>
            <p className="text-sm font-semibold text-ink">{event.title}</p>
          </li>
        ))}
      </ul>
      <p className="mt-5 text-xs text-muted">
        Filtros: provas · entregas · aulas
      </p>
    </aside>
  );
}
