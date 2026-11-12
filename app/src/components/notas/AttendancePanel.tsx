import type { GradeRow } from "../../services/grades";
import { PASTEL_BAR } from "../../lib/colors";

type AttendancePanelProps = {
  rows: GradeRow[];
};

export function AttendancePanel({ rows }: AttendancePanelProps) {
  return (
    <aside className="min-w-0 rounded-2xl border border-bloom-100 bg-surface p-4 shadow-sm sm:p-5">
      <h3 className="text-base font-bold text-ink">Frequência</h3>
      <p className="mt-1 text-xs text-muted">
        Mínimo exigido: configure por disciplina
      </p>

      <ul className="mt-5 space-y-4">
        {rows.map((row) => (
          <li key={row.id}>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-ink">
                {row.subjectName === "Redes de Computadores"
                  ? "Redes"
                  : row.subjectName}
              </span>
              <span className="text-sm font-bold text-ink">
                {row.attendancePercent}%
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-bloom-100">
              <div
                className={`h-full rounded-full ${PASTEL_BAR[row.color]}`}
                style={{ width: `${row.attendancePercent}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}
