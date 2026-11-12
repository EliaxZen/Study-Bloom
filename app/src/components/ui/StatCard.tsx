import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

type StatCardProps = {
  label: string;
  value: string;
  icon?: ReactNode;
  iconWrapClassName?: string;
  className?: string;
};

export function StatCard({
  label,
  value,
  icon,
  iconWrapClassName,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-bloom-100 bg-surface px-4 py-4 shadow-sm sm:gap-4 sm:px-5",
        className,
      )}
    >
      {icon ? (
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg",
            iconWrapClassName ?? "bg-pastel-lavender text-bloom-600",
          )}
        >
          {icon}
        </span>
      ) : null}
      <div>
        <p className="text-xs text-muted">{label}</p>
        <p className="mt-0.5 text-2xl font-bold tracking-tight text-ink">
          {value}
        </p>
      </div>
    </div>
  );
}
