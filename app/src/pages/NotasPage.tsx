import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { AttendancePanel } from "../components/notas/AttendancePanel";
import { GradesTable } from "../components/notas/GradesTable";
import { SimpleModal } from "../components/ui/SimpleModal";
import { StatCard } from "../components/ui/StatCard";
import { formatGrade, listGrades, type GradeRow } from "../services/grades";

export function NotasPage() {
  const [rows, setRows] = useState<GradeRow[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    void listGrades().then(setRows);
  }, []);

  const calcAverage = rows.find((r) => r.subjectId === "calc-1")?.average ?? 7.4;
  const generalAttendance =
    rows.length === 0
      ? 89
      : Math.round(
          rows.reduce((sum, r) => sum + r.attendancePercent, 0) / rows.length,
        );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Média em Cálculo"
          value={formatGrade(calcAverage)}
          icon={<Sparkles className="h-5 w-5" />}
          iconWrapClassName="bg-pastel-pink text-[#db2777]"
        />
        <StatCard
          label="Frequência geral"
          value={`${generalAttendance}%`}
          icon={<Sparkles className="h-5 w-5" />}
          iconWrapClassName="bg-pastel-mint text-emerald-700"
        />
        <StatCard
          label="Disciplinas ativas"
          value="05"
          icon={<Sparkles className="h-5 w-5" />}
          iconWrapClassName="bg-pastel-lavender text-bloom-600"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(260px,1fr)]">
        <GradesTable rows={rows} onAdd={() => setModalOpen(true)} />
        <AttendancePanel rows={rows} />
      </div>

      <p className="text-xs text-muted">
        ✦ Configure os pesos das avaliações, os critérios de média e os limites
        de presença por matéria.
      </p>

      <SimpleModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Adicionar avaliação"
        description="Registre uma nota por disciplina — persistência em breve."
      >
        <div className="space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink">Disciplina</span>
            <select className="w-full rounded-xl border border-bloom-200 bg-bloom-50/50 px-3 py-2.5 text-sm outline-none focus:border-bloom-400">
              {rows.map((r) => (
                <option key={r.id} value={r.subjectId}>
                  {r.subjectName}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink">Nota</span>
            <input
              type="number"
              min={0}
              max={10}
              step={0.1}
              placeholder="7,5"
              className="w-full rounded-xl border border-bloom-200 bg-bloom-50/50 px-3 py-2.5 text-sm outline-none focus:border-bloom-400"
            />
          </label>
        </div>
      </SimpleModal>
    </div>
  );
}
