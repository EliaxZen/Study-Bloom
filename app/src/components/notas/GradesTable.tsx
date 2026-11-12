import { Pencil, Plus } from "lucide-react";
import type { GradeRow } from "../../services/grades";
import { formatGrade } from "../../services/grades";
import type { GradeWeights } from "../../stores/settingsStore";

type GradesTableProps = {
  rows: GradeRow[];
  weights: GradeWeights;
  onAdd?: () => void;
  onEdit?: (row: GradeRow) => void;
};

export function GradesTable({
  rows,
  weights,
  onAdd,
  onEdit,
}: GradesTableProps) {
  return (
    <section className="min-w-0 rounded-2xl border border-bloom-100 bg-surface p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-ink">Notas por disciplina</h3>
          <p className="mt-0.5 text-xs text-muted">
            Pesos: Av1 {weights.assessment1}% · Av2 {weights.assessment2}%
          </p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          disabled={rows.length === 0}
          className="inline-flex items-center gap-1.5 rounded-xl bg-bloom-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-bloom-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" />
          Adicionar avaliação
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted">Nenhuma disciplina para exibir.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-bloom-100">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="bg-pastel-lavender/80 text-xs font-semibold text-bloom-700">
                <th className="sticky left-0 z-10 bg-pastel-lavender px-3 py-3 sm:px-4">
                  Disciplina
                </th>
                <th className="px-3 py-3 whitespace-nowrap sm:px-4">
                  Avaliação 1
                </th>
                <th className="px-3 py-3 whitespace-nowrap sm:px-4">
                  Avaliação 2
                </th>
                <th className="px-3 py-3 sm:px-4">Média</th>
                <th className="px-3 py-3 text-right sm:px-4">
                  <span className="sr-only">Editar</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr
                  key={row.id}
                  className={`border-t border-bloom-100/80 text-ink ${
                    index % 2 === 1 ? "bg-bloom-50/50" : "bg-surface"
                  }`}
                >
                  <td
                    className={`sticky left-0 z-10 px-3 py-3 font-medium sm:px-4 ${
                      index % 2 === 1 ? "bg-bloom-50" : "bg-surface"
                    }`}
                  >
                    {row.subjectName}
                  </td>
                  <td className="px-3 py-3 sm:px-4">
                    {formatGrade(row.assessment1)}
                  </td>
                  <td className="px-3 py-3 sm:px-4">
                    {formatGrade(row.assessment2)}
                  </td>
                  <td className="px-3 py-3 font-bold sm:px-4">
                    {formatGrade(row.average)}
                  </td>
                  <td className="px-3 py-3 text-right sm:px-4">
                    <button
                      type="button"
                      onClick={() => onEdit?.(row)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-bloom-100 hover:text-bloom-700"
                      aria-label={`Editar notas de ${row.subjectName}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
