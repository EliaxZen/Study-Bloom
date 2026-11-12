import { Clock } from "lucide-react";
import type { Reminder } from "../../types";
import { PASTEL_BG } from "../../lib/colors";
import { formatReminderWhen } from "../../services/reminders";
import { cn } from "../../lib/utils";

type ReminderListProps = {
  reminders: Reminder[];
};

export function ReminderList({ reminders }: ReminderListProps) {
  return (
    <section className="rounded-2xl border border-bloom-100 bg-surface p-5 shadow-sm">
      <h3 className="mb-4 text-base font-bold text-ink">Seus lembretes</h3>
      <ul className="space-y-3">
        {reminders.map((reminder) => (
          <li
            key={reminder.id}
            className={cn(
              "flex items-center gap-3 rounded-2xl px-4 py-3.5",
              PASTEL_BG[reminder.color],
            )}
          >
            <Clock className="h-4 w-4 shrink-0 text-ink/70" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-ink/70">
                {formatReminderWhen(reminder.datetime)}
              </p>
              <p className="truncate text-sm font-semibold text-ink">
                {reminder.title}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
