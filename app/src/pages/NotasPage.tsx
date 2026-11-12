import { useCallback, useEffect, useMemo, useState } from "react";
import { Sparkles, Trash2 } from "lucide-react";
import { AttendancePanel } from "../components/notas/AttendancePanel";
import { GradesTable } from "../components/notas/GradesTable";
import { SimpleModal } from "../components/ui/SimpleModal";
import { StatCard } from "../components/ui/StatCard";
import { StatusMessage } from "../components/ui/StatusMessage";
import {
  clearAssessments,
  formatActiveSubjects,
  formatGrade,
  listGrades,
  normalizeGradeWeights,
  updateAttendance,
  updateGrade,
  upsertAssessment,
  type GradeAssessmentSlot,
  type GradeRow,
} from "../services/grades";
import { useSettingsStore } from "../stores/settingsStore";
import { useToastStore } from "../stores/toastStore";

type ModalMode = "add" | "edit";

type FormState = {
  subjectId: string;
  slot: GradeAssessmentSlot;
  value: string;
  assessment1: string;
  assessment2: string;
};

const EMPTY_FORM: FormState = {
  subjectId: "",
  slot: "assessment1",
  value: "",
  assessment1: "",
  assessment2: "",
};

function gradeToInput(value?: number): string {
  return value === undefined || value === null ? "" : String(value);
}

const ATTENDANCE_MIN = 75;

function parseOptionalGrade(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const num = Number(trimmed.replace(",", "."));
  if (!Number.isFinite(num) || num < 0 || num > 10) {
    throw new Error("Informe uma nota válida (0 a 10)");
  }
  return num;
}

function parseRequiredGrade(raw: string): number {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error("Informe uma nota válida (0 a 10)");
  const num = Number(trimmed.replace(",", "."));
  if (!Number.isFinite(num) || num < 0 || num > 10) {
    throw new Error("Informe uma nota válida (0 a 10)");
  }
  return num;
}

export function NotasPage() {
  const gradeWeights = useSettingsStore((s) => s.gradeWeights);
  const setGradeWeights = useSettingsStore((s) => s.setGradeWeights);
  const showToast = useToastStore((s) => s.show);

  const [rows, setRows] = useState<GradeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("add");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [clearing, setClearing] = useState(false);
  const [weightDraft, setWeightDraft] = useState({
    assessment1: String(gradeWeights.assessment1),
    assessment2: String(gradeWeights.assessment2),
  });

  const refresh = useCallback(async () => {
    const data = await listGrades(gradeWeights);
    setRows(data);
  }, [gradeWeights]);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const data = await listGrades(gradeWeights);
        if (!alive) return;
        setRows(data);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [gradeWeights]);

  useEffect(() => {
    setWeightDraft({
      assessment1: String(gradeWeights.assessment1),
      assessment2: String(gradeWeights.assessment2),
    });
  }, [gradeWeights]);

  const calcAverage =
    rows.find((r) => r.subjectId === "calc-1")?.average ?? undefined;
  const generalAttendance =
    rows.length === 0
      ? 0
      : Math.round(
          rows.reduce((sum, r) => sum + r.attendancePercent, 0) / rows.length,
        );

  const canSubmit = useMemo(() => {
    if (rows.length === 0) return false;
    if (modalMode === "add") {
      return form.subjectId.length > 0 && form.value.trim().length > 0;
    }
    return form.subjectId.length > 0;
  }, [form, modalMode, rows.length]);

  const openAdd = () => {
    if (rows.length === 0) {
      showToast("Cadastre uma disciplina antes de lançar notas");
      return;
    }
    setModalMode("add");
    setForm({
      ...EMPTY_FORM,
      subjectId: rows[0]?.subjectId ?? "",
      slot: "assessment1",
    });
    setModalOpen(true);
  };

  const openEdit = (row: GradeRow) => {
    setModalMode("edit");
    setForm({
      subjectId: row.subjectId,
      slot: "assessment1",
      value: "",
      assessment1: gradeToInput(row.assessment1),
      assessment2: gradeToInput(row.assessment2),
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (clearing) return;
    setModalOpen(false);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      throw new Error("Preencha os campos obrigatórios");
    }

    if (modalMode === "add") {
      const num = parseRequiredGrade(form.value);
      await upsertAssessment(
        { subjectId: form.subjectId, slot: form.slot, value: num },
        gradeWeights,
      );
      showToast("Avaliação salva");
    } else {
      const a1 = parseOptionalGrade(form.assessment1);
      const a2 = parseOptionalGrade(form.assessment2);
      await updateGrade(
        form.subjectId,
        { assessment1: a1, assessment2: a2 },
        gradeWeights,
      );
      showToast("Notas atualizadas");
    }

    await refresh();
  };

  const handleClearAssessments = async () => {
    if (!form.subjectId) return;
    const ok = window.confirm("Limpar as avaliações desta disciplina?");
    if (!ok) return;
    setClearing(true);
    try {
      await clearAssessments(form.subjectId, gradeWeights);
      await refresh();
      setModalOpen(false);
      setForm(EMPTY_FORM);
      showToast("Avaliações removidas");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Erro ao limpar notas");
    } finally {
      setClearing(false);
    }
  };

  const handleAttendanceChange = async (
    subjectId: string,
    percent: number,
  ) => {
    const prev = rows.find((r) => r.subjectId === subjectId);
    const clamped = Math.min(100, Math.max(0, Math.round(percent)));
    setRows((current) =>
      current.map((row) =>
        row.subjectId === subjectId
          ? { ...row, attendancePercent: clamped }
          : row,
      ),
    );
    try {
      await updateAttendance(subjectId, clamped, gradeWeights);
      if (
        prev &&
        prev.attendancePercent >= ATTENDANCE_MIN &&
        clamped < ATTENDANCE_MIN
      ) {
        showToast(
          `Frequência de ${prev.subjectName} abaixo de ${ATTENDANCE_MIN}%`,
        );
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Erro ao salvar frequência");
      await refresh();
    }
  };

  const applyWeights = () => {
    const w1 = Number(weightDraft.assessment1);
    const w2 = Number(weightDraft.assessment2);
    if (!Number.isFinite(w1) || !Number.isFinite(w2) || w1 < 0 || w2 < 0) {
      showToast("Pesos inválidos");
      return;
    }
    try {
      const normalized = normalizeGradeWeights(w1, w2);
      setGradeWeights(normalized);
      showToast("Pesos atualizados");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Pesos inválidos");
    }
  };

  const editingSubjectName =
    rows.find((r) => r.subjectId === form.subjectId)?.subjectName ?? "";

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
          value={formatActiveSubjects(rows.length)}
          icon={<Sparkles className="h-5 w-5" />}
          iconWrapClassName="bg-pastel-lavender text-bloom-600"
        />
      </div>

      <section className="rounded-2xl border border-bloom-100 bg-surface p-4 shadow-sm sm:p-5">
        <h3 className="text-base font-bold text-ink">Pesos das avaliações</h3>
        <p className="mt-1 text-xs text-muted">
          A média de cada disciplina usa esses pesos (normalizados para 100%).
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="mb-1 block font-medium text-ink">Peso Av1 (%)</span>
            <input
              type="number"
              min={0}
              max={100}
              value={weightDraft.assessment1}
              onChange={(e) =>
                setWeightDraft((w) => ({ ...w, assessment1: e.target.value }))
              }
              className="w-24 rounded-xl border border-bloom-200 bg-bloom-50/50 px-3 py-2 text-sm outline-none focus:border-bloom-400"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-ink">Peso Av2 (%)</span>
            <input
              type="number"
              min={0}
              max={100}
              value={weightDraft.assessment2}
              onChange={(e) =>
                setWeightDraft((w) => ({ ...w, assessment2: e.target.value }))
              }
              className="w-24 rounded-xl border border-bloom-200 bg-bloom-50/50 px-3 py-2 text-sm outline-none focus:border-bloom-400"
            />
          </label>
          <button
            type="button"
            onClick={applyWeights}
            className="rounded-xl bg-bloom-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-bloom-700"
          >
            Aplicar pesos
          </button>
        </div>
      </section>

      {loading ? (
        <StatusMessage>Carregando notas…</StatusMessage>
      ) : rows.length === 0 ? (
        <StatusMessage variant="empty">
          Nenhuma disciplina ainda. Adicione em Disciplinas para lançar notas e
          frequência.
        </StatusMessage>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(260px,1fr)]">
          <GradesTable
            rows={rows}
            weights={gradeWeights}
            onAdd={openAdd}
            onEdit={openEdit}
          />
          <AttendancePanel
            rows={rows}
            minPercent={ATTENDANCE_MIN}
            onChangePercent={(subjectId, percent) => {
              void handleAttendanceChange(subjectId, percent);
            }}
          />
        </div>
      )}

      <p className="text-xs text-muted">
        ✦ Notas, pesos e frequência são salvos neste dispositivo.
      </p>

      <SimpleModal
        open={modalOpen}
        onClose={closeModal}
        onSubmit={handleSubmit}
        submitLabel="Salvar"
        submitDisabled={!canSubmit || clearing}
        submitting={clearing ? true : undefined}
        title={
          modalMode === "add" ? "Adicionar avaliação" : "Editar notas"
        }
        description={
          modalMode === "add"
            ? "Registre uma nota por disciplina — salva neste dispositivo."
            : `Ajuste as avaliações de ${editingSubjectName}. Deixe em branco para limpar.`
        }
      >
        <div className="space-y-3">
          {modalMode === "add" ? (
            <>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-ink">
                  Disciplina
                </span>
                <select
                  value={form.subjectId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, subjectId: e.target.value }))
                  }
                  className="w-full rounded-xl border border-bloom-200 bg-bloom-50/50 px-3 py-2.5 text-sm outline-none focus:border-bloom-400"
                >
                  {rows.map((r) => (
                    <option key={r.id} value={r.subjectId}>
                      {r.subjectName}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-ink">
                  Avaliação
                </span>
                <select
                  value={form.slot}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      slot: e.target.value as GradeAssessmentSlot,
                    }))
                  }
                  className="w-full rounded-xl border border-bloom-200 bg-bloom-50/50 px-3 py-2.5 text-sm outline-none focus:border-bloom-400"
                >
                  <option value="assessment1">Avaliação 1</option>
                  <option value="assessment2">Avaliação 2</option>
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-ink">Nota</span>
                <input
                  type="number"
                  min={0}
                  max={10}
                  step={0.1}
                  value={form.value}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, value: e.target.value }))
                  }
                  placeholder="7,5"
                  className="w-full rounded-xl border border-bloom-200 bg-bloom-50/50 px-3 py-2.5 text-sm outline-none focus:border-bloom-400"
                />
              </label>
            </>
          ) : (
            <>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-ink">
                  Avaliação 1
                </span>
                <input
                  type="number"
                  min={0}
                  max={10}
                  step={0.1}
                  value={form.assessment1}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, assessment1: e.target.value }))
                  }
                  placeholder="—"
                  className="w-full rounded-xl border border-bloom-200 bg-bloom-50/50 px-3 py-2.5 text-sm outline-none focus:border-bloom-400"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-ink">
                  Avaliação 2
                </span>
                <input
                  type="number"
                  min={0}
                  max={10}
                  step={0.1}
                  value={form.assessment2}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, assessment2: e.target.value }))
                  }
                  placeholder="—"
                  className="w-full rounded-xl border border-bloom-200 bg-bloom-50/50 px-3 py-2.5 text-sm outline-none focus:border-bloom-400"
                />
              </label>
              <button
                type="button"
                onClick={() => void handleClearAssessments()}
                disabled={clearing}
                className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                {clearing ? "Limpando…" : "Limpar avaliações"}
              </button>
            </>
          )}
        </div>
      </SimpleModal>
    </div>
  );
}
