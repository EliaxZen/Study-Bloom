import { useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { DateClickArg } from "@fullcalendar/interaction";
import type { EventClickArg } from "@fullcalendar/core";
import type { CalendarEvent } from "../../types";
import { PASTEL_HEX } from "../../lib/colors";
import { ChevronLeft, ChevronRight } from "lucide-react";

type MonthCalendarProps = {
  events: CalendarEvent[];
  currentDate: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onDateClick?: (dateStr: string) => void;
  onEventClick?: (eventId: string) => void;
};

function localMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function MonthCalendar({
  events,
  currentDate,
  onPrev,
  onNext,
  onToday,
  onDateClick,
  onEventClick,
}: MonthCalendarProps) {
  const fcEvents = useMemo(
    () =>
      events.map((event) => ({
        id: event.id,
        title: event.title,
        start: event.date,
        allDay: true,
        backgroundColor: PASTEL_HEX[event.color],
        borderColor: PASTEL_HEX[event.color],
        textColor: "#2d2640",
      })),
    [events],
  );

  const monthLabel = currentDate.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
  const monthTitle =
    monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

  const handleDateClick = (info: DateClickArg) => {
    // dateStr já vem YYYY-MM-DD no clique de dia (all-day / local)
    onDateClick?.(info.dateStr.slice(0, 10));
  };

  const handleEventClick = (info: EventClickArg) => {
    info.jsEvent.preventDefault();
    onEventClick?.(info.event.id);
  };

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-bloom-100 bg-surface p-3 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <span className="rounded-full bg-bloom-50 px-3 py-1.5 text-sm font-semibold text-ink sm:px-4">
          {monthTitle}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onPrev}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-muted hover:bg-bloom-50 sm:h-9 sm:w-9"
            aria-label="Mês anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onToday}
            className="min-h-11 rounded-lg px-3 py-1.5 text-sm font-semibold text-ink hover:bg-bloom-50 sm:min-h-0"
          >
            Hoje
          </button>
          <button
            type="button"
            onClick={onNext}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-muted hover:bg-bloom-50 sm:h-9 sm:w-9"
            aria-label="Próximo mês"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="bloom-calendar min-w-0 max-w-full overflow-x-auto">
        <FullCalendar
          key={localMonthKey(currentDate)}
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          initialDate={currentDate}
          locale="pt-br"
          firstDay={1}
          headerToolbar={false}
          height="auto"
          events={fcEvents}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          dayHeaderFormat={{ weekday: "short" }}
          dayMaxEvents={3}
          moreLinkText={(n) => `+${n}`}
          dayCellContent={(arg) => {
            const isToday = arg.isToday;
            return (
              <span
                className={
                  isToday
                    ? "inline-flex items-center rounded-md bg-pastel-lavender px-1.5 font-semibold text-bloom-700"
                    : undefined
                }
                title={isToday ? "Hoje" : undefined}
              >
                {arg.dayNumberText}
              </span>
            );
          }}
        />
      </div>

      <p className="mt-4 text-xs text-muted">
        Clique em um dia para criar · clique em um evento para editar
      </p>
    </section>
  );
}
