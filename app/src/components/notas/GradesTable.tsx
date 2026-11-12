import { Plus } from "lucide-react";
import type { GradeRow } from "../../services/grades";
import { formatGrade } from "../../services/grades";

type GradesTableProps = {
  rows: GradeRow[];
  onAdd?: () => void;
};

export function GradesTable({ rows, onAdd }: GradesTableProps) {
  return (
    <section className="min-w-0 rounded-2xl border border-bloom-100 bg-surface p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-bold text-ink">Notas por disciplina</h3>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 rounded-xl bg-bloom-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-bloom-700"
        >
          <Plus className="h-3.5 w-3.5" />
          Adicionar avaliação
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-bloom-100">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr className="bg-pastel-lavender/80 text-xs font-semibold text-bloom-700">
              <th className="sticky left-0 z-10 bg-pastel-lavender px-3 py-3 sm:px-4">
                Disciplina
              </th>
              <th className="px-3 py-3 whitespace-nowrap sm:px-4">Avaliação 1</th>
              <th className="px-3 py-3 whitespace-nowrap sm:px-4">Avaliação 2</th>
              <th className="px-3 py-3 sm:px-4">Média</th>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
