import { useEffect, useState } from "react";
import {
  Download,
  FileSpreadsheet,
  Palette,
  Save,
  Upload,
} from "lucide-react";
import { ThemeToggle } from "../components/layout/ThemeToggle";
import { SemesterFields } from "../components/settings/SemesterFields";
import { ThemeCustomizer } from "../components/theme/ThemeCustomizer";
import {
  exportBackupCsvWithDialog,
  exportBackupJsonWithDialog,
  importBackupWithDialog,
  type ImportMode,
} from "../services/backup";
import type { ThemeMode } from "../services/themePersistence";
import { useSemesterStore } from "../stores/semesterStore";
import { useSettingsStore } from "../stores/settingsStore";
import { useThemeStore } from "../stores/themeStore";
import { useToastStore } from "../stores/toastStore";

export function SettingsPage() {
  const semester = useSemesterStore((s) => s.semester);
  const updateSemester = useSemesterStore((s) => s.updateSemester);
  const gradeWeights = useSettingsStore((s) => s.gradeWeights);
  const notifications = useSettingsStore((s) => s.notifications);
  const setGradeWeights = useSettingsStore((s) => s.setGradeWeights);
  const setNotifications = useSettingsStore((s) => s.setNotifications);
  const themeMode = useThemeStore((s) => s.mode);
  const accentHex = useThemeStore((s) => s.accentHex);
  const setMode = useThemeStore((s) => s.setMode);
  const toggleDarkShortcut = useThemeStore((s) => s.toggleDarkShortcut);
  const showToast = useToastStore((s) => s.show);
  const [accentOpen, setAccentOpen] = useState(false);

  const [label, setLabel] = useState(semester.label);
  const [course, setCourse] = useState(semester.course);
  const [w1, setW1] = useState(String(gradeWeights.assessment1));
  const [w2, setW2] = useState(String(gradeWeights.assessment2));
  const [reminders, setReminders] = useState(notifications.reminders);
  const [focusAlerts, setFocusAlerts] = useState(notifications.focusAlerts);
  const [calendarAlerts, setCalendarAlerts] = useState(
    notifications.calendarAlerts,
  );
  const [minutesBefore, setMinutesBefore] = useState(
    String(notifications.minutesBefore),
  );
  const [themeDraft, setThemeDraft] = useState<ThemeMode>(themeMode);
  const [importMode, setImportMode] = useState<ImportMode>("merge");
  const [backupBusy, setBackupBusy] = useState(false);

  useEffect(() => {
    setLabel(semester.label);
    setCourse(semester.course);
  }, [semester.label, semester.course]);

  useEffect(() => {
    setW1(String(gradeWeights.assessment1));
    setW2(String(gradeWeights.assessment2));
  }, [gradeWeights.assessment1, gradeWeights.assessment2]);

  useEffect(() => {
    setReminders(notifications.reminders);
    setFocusAlerts(notifications.focusAlerts);
    setCalendarAlerts(notifications.calendarAlerts);
    setMinutesBefore(String(notifications.minutesBefore));
  }, [notifications]);

  useEffect(() => {
    setThemeDraft(themeMode);
  }, [themeMode]);

  const handleSave = async () => {
    const a1 = Number(w1);
    const a2 = Number(w2);
    if (!Number.isFinite(a1) || !Number.isFinite(a2) || a1 < 0 || a2 < 0) {
      showToast("Pesos inválidos — use números ≥ 0");
      return;
    }
    const total = a1 + a2;
    if (total <= 0) {
      showToast("A soma dos pesos precisa ser maior que zero");
      return;
    }

    const minutes = Number(minutesBefore);
    if (!Number.isFinite(minutes) || minutes < 0 || minutes > 180) {
      showToast("Antecedência inválida (0–180 min)");
      return;
    }

    const a1Pct = Math.round((a1 / total) * 100);
    updateSemester({ label, course });
    setGradeWeights({
      assessment1: a1Pct,
      assessment2: 100 - a1Pct,
    });
    setNotifications({
      reminders,
      focusAlerts,
      calendarAlerts,
      minutesBefore: Math.round(minutes),
    });
    await setMode(themeDraft);
    showToast("Configurações salvas ✿");
  };

  const runBackup = async (
    action: () => ReturnType<typeof exportBackupJsonWithDialog>,
    successMsg: (r: { rows: number; tables: number }) => string,
  ) => {
    if (backupBusy) return;
    setBackupBusy(true);
    try {
      const result = await action();
      if (!result.ok) {
        if (!result.cancelled) showToast(result.error);
        return;
      }
      showToast(successMsg(result));
    } finally {
      setBackupBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <section className="rounded-2xl border border-bloom-200/80 bg-surface p-5">
        <h2 className="text-base font-bold text-ink">Semestre e curso</h2>
        <p className="mt-1 text-sm text-muted">
          Aparece na barra lateral e no cabeçalho das telas.
        </p>
        <SemesterFields
          className="mt-4"
          layout="grid"
          value={{ label, course }}
          onChange={(next) => {
            setLabel(next.label);
            setCourse(next.course);
          }}
        />
      </section>

      <section className="rounded-2xl border border-bloom-200/80 bg-surface p-5">
        <h2 className="text-base font-bold text-ink">Pesos das notas</h2>
        <p className="mt-1 text-sm text-muted">
          Usados na média ponderada (normalizados para 100% ao salvar).
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink">
              Avaliação 1 (%)
            </span>
            <input
              type="number"
              min={0}
              max={100}
              value={w1}
              onChange={(e) => setW1(e.target.value)}
              className="w-full rounded-xl border border-bloom-200 bg-bloom-50/50 px-3 py-2.5 text-sm outline-none focus:border-bloom-400"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink">
              Avaliação 2 (%)
            </span>
            <input
              type="number"
              min={0}
              max={100}
              value={w2}
              onChange={(e) => setW2(e.target.value)}
              className="w-full rounded-xl border border-bloom-200 bg-bloom-50/50 px-3 py-2.5 text-sm outline-none focus:border-bloom-400"
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-bloom-200/80 bg-surface p-5">
        <h2 className="text-base font-bold text-ink">Notificações</h2>
        <p className="mt-1 text-sm text-muted">
          Preferências locais para lembretes e alertas.
        </p>
        <div className="mt-4 space-y-3">
          <ToggleRow
            label="Lembretes"
            checked={reminders}
            onChange={setReminders}
          />
          <ToggleRow
            label="Alertas de foco"
            checked={focusAlerts}
            onChange={setFocusAlerts}
          />
          <ToggleRow
            label="Alertas do calendário"
            checked={calendarAlerts}
            onChange={setCalendarAlerts}
          />
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink">
              Antecedência (minutos)
            </span>
            <input
              type="number"
              min={0}
              max={180}
              value={minutesBefore}
              onChange={(e) => setMinutesBefore(e.target.value)}
              className="w-full max-w-[10rem] rounded-xl border border-bloom-200 bg-bloom-50/50 px-3 py-2.5 text-sm outline-none focus:border-bloom-400"
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-bloom-200/80 bg-surface p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-ink">Tema</h2>
            <p className="mt-1 text-sm text-muted">
              Claro, escuro ou seguir o sistema.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              void (async () => {
                await toggleDarkShortcut();
                setThemeDraft(useThemeStore.getState().mode);
                showToast("Tema alternado");
              })();
            }}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-bloom-200 bg-bloom-50 px-3 py-2 text-sm font-medium text-bloom-700 hover:bg-bloom-100"
          >
            Atalho claro/escuro
          </button>
        </div>
        <div className="mt-4">
          <ThemeToggle
            draftMode={themeDraft}
            onDraftChange={(mode) => setThemeDraft(mode)}
          />
        </div>
        <button
          type="button"
          onClick={() => setAccentOpen(true)}
          className="mt-4 inline-flex min-h-11 w-full items-center justify-between gap-2 rounded-xl border border-bloom-200 bg-bloom-50/60 px-3 py-2.5 text-sm font-medium text-bloom-700 hover:bg-bloom-100"
        >
          <span className="inline-flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Personalizar cores (accent)
          </span>
          <span
            className="h-6 w-6 rounded-full shadow-sm ring-2 ring-white"
            style={{ backgroundColor: accentHex }}
            aria-hidden
          />
        </button>
      </section>

      <ThemeCustomizer open={accentOpen} onClose={() => setAccentOpen(false)} />

      <section className="rounded-2xl border border-bloom-200/80 bg-surface p-5">
        <h2 className="text-base font-bold text-ink">Backup</h2>
        <p className="mt-1 text-sm text-muted">
          Exporte todos os dados (JSON) ou um resumo CSV — funciona no desktop e
          no navegador. Na importação, mesclar ou substituir; substituir sempre
          pede confirmação antes de apagar.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={backupBusy}
            onClick={() =>
              void runBackup(
                exportBackupJsonWithDialog,
                (r) =>
                  `Backup JSON salvo (${r.rows} registros em ${r.tables} tabelas)`,
              )
            }
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-bloom-600 px-3 py-2 text-sm font-semibold text-white hover:bg-bloom-700 disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            Exportar JSON
          </button>
          <button
            type="button"
            disabled={backupBusy}
            onClick={() =>
              void runBackup(
                exportBackupCsvWithDialog,
                (r) => `CSV exportado (${r.rows} linhas)`,
              )
            }
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-bloom-200 bg-bloom-50 px-3 py-2 text-sm font-medium text-bloom-700 hover:bg-bloom-100 disabled:opacity-60"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Exportar CSV
          </button>
        </div>

        <div className="mt-5 space-y-3">
          <p className="text-sm font-medium text-ink">Modo de importação</p>
          <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-bloom-200/70 bg-bloom-50/40 px-3 py-2.5">
            <input
              type="radio"
              name="import-mode"
              className="mt-1 accent-bloom-600"
              checked={importMode === "merge"}
              onChange={() => setImportMode("merge")}
            />
            <span>
              <span className="block text-sm font-medium text-ink">Mesclar</span>
              <span className="text-xs text-muted">
                Atualiza registros com o mesmo id; o restante permanece.
              </span>
            </span>
          </label>
          <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-bloom-200/70 bg-bloom-50/40 px-3 py-2.5">
            <input
              type="radio"
              name="import-mode"
              className="mt-1 accent-bloom-600"
              checked={importMode === "replace"}
              onChange={() => setImportMode("replace")}
            />
            <span>
              <span className="block text-sm font-medium text-ink">
                Substituir tudo
              </span>
              <span className="text-xs text-muted">
                Apaga os dados atuais antes de importar (pede confirmação).
              </span>
            </span>
          </label>
          <button
            type="button"
            disabled={backupBusy}
            onClick={() =>
              void runBackup(
                () => importBackupWithDialog(importMode),
                (r) =>
                  importMode === "replace"
                    ? `Dados substituídos (${r.rows} registros)`
                    : `Backup mesclado (${r.rows} registros)`,
              )
            }
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-bloom-300 bg-surface px-3 py-2 text-sm font-semibold text-ink hover:bg-bloom-50 disabled:opacity-60"
          >
            <Upload className="h-4 w-4" />
            Importar backup…
          </button>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => void handleSave()}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-bloom-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-bloom-700"
        >
          <Save className="h-4 w-4" />
          Salvar configurações
        </button>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-xl border border-bloom-200/70 bg-bloom-50/40 px-3 py-2.5">
      <span className="text-sm font-medium text-ink">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-bloom-600"
      />
    </label>
  );
}
