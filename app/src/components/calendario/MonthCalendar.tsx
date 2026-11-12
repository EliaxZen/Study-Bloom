import { useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { CalendarEvent } from "../../types";
import { PASTEL_HEX } from "../../lib/colors";
import { ChevronLeft, ChevronRight } from "lucide-react";

type MonthCalendarProps = {
  events: CalendarEvent[];
  currentDate: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
};

export function MonthCalendar({
  events,
  currentDate,
  onPrev,
  onNext,
  onToday,
}: MonthCalendarProps) {
  const fcEvents = useMemo(
    () =>
      events.map((event) => ({
        id: event.id,
        title: event.title,
        date: event.date,
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

  return (
    <section className="min-w-0 rounded-2xl border border-bloom-100 bg-surface p-3 shadow-sm sm:p-5">
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

      <div className="bloom-calendar min-w-0 overflow-x-auto">
        <FullCalendar
          key={currentDate.toISOString()}
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          initialDate={currentDate}
          locale="pt-br"
          firstDay={1}
          headerToolbar={false}
          height="auto"
          events={fcEvents}
          dayHeaderFormat={{ weekday: "short" }}
          dayCellContent={(arg) => {
            const isToday = arg.isToday;
            return (
              <div className="flex flex-col gap-0.5">
                <span
                  className={
                    isToday
                      ? "inline-flex rounded-md bg-pastel-lavender px-1.5 font-semibold text-bloom-700"
                      : undefined
                  }
                >
                  {arg.dayNumberText}
                </span>
                {isToday ? (
                  <span className="text-[10px] font-semibold text-bloom-600">
                    Hoje
                  </span>
                ) : null}
              </div>
            );
          }}
        />
      </div>

      <p className="mt-4 text-xs text-muted">
        ✦ Eventos por disciplina, alertas prévios, recorrências e alternância
        entre mês, semana e lista.
      </p>
    </section>
  );
}
