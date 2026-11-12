import type { GradeRow } from "../../services/grades";
import { PASTEL_BAR } from "../../lib/colors";

const DEFAULT_MIN = 75;

type AttendancePanelProps = {
  rows: GradeRow[];
  minPercent?: number;
  onChangePercent?: (subjectId: string, percent: number) => void;
};

function shortName(name: string): string {
  return name === "Redes de Computadores" ? "Redes" : name;
}

export function AttendancePanel({
  rows,
  minPercent = DEFAULT_MIN,
  onChangePercent,
}: AttendancePanelProps) {
  return (
    <aside className="min-w-0 rounded-2xl border border-bloom-100 bg-surface p-4 shadow-sm sm:p-5">
      <h3 className="text-base font-bold text-ink">Frequência</h3>
      <p className="mt-1 text-xs text-muted">
        Mínimo exigido: {minPercent}% por disciplina
      </p>

      {rows.length === 0 ? (
        <p className="mt-5 text-sm text-muted">Nenhuma disciplina para exibir.</p>
      ) : (
        <ul className="mt-5 space-y-4">
          {rows.map((row) => {
            const below = row.attendancePercent < minPercent;
            return (
              <li key={row.id}>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-ink">
                    {shortName(row.subjectName)}
                  </span>
                  <label className="flex items-center gap-1 text-sm font-bold text-ink">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={1}
                      value={row.attendancePercent}
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (raw.trim() === "") return;
                        const next = Number(raw);
                        if (!Number.isFinite(next)) return;
                        onChangePercent?.(
                          row.subjectId,
                          Math.min(100, Math.max(0, Math.round(next))),
                        );
                      }}
                      className={`w-14 rounded-lg border px-1.5 py-1 text-right text-sm font-bold outline-none focus:border-bloom-400 ${
                        below
                          ? "border-rose-300 bg-rose-50 text-rose-700"
                          : "border-bloom-200 bg-bloom-50/50 text-ink"
                      }`}
                      aria-label={`Frequência de ${row.subjectName}`}
                    />
                    <span className={below ? "text-rose-600" : "text-ink"}>
                      %
                    </span>
                  </label>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-bloom-100">
                  <div
                    className={`h-full rounded-full ${PASTEL_BAR[row.color]}`}
                    style={{
                      width: `${Math.min(100, Math.max(0, row.attendancePercent))}%`,
                    }}
                  />
                </div>
                {below ? (
                  <p className="mt-1 text-[11px] font-medium text-rose-600">
                    Abaixo do mínimo ({minPercent}%)
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
