import {
  useFocusStore,
  type FocusAlertMode,
} from "../../stores/focusStore";
import { formControlClassName } from "../ui/formStyles";

const ALERT_OPTIONS: { value: FocusAlertMode; label: string }[] = [
  { value: "sound", label: "Som" },
  { value: "notify", label: "Notificação" },
  { value: "both", label: "Som + notificação" },
];

function readNumberInput(raw: string): number | null {
  if (raw.trim() === "") return null;
  const value = Number(raw);
  if (!Number.isFinite(value)) return null;
  return value;
}

export function RoutineCard() {
  const durationMinutes = useFocusStore((s) => s.durationMinutes);
  const breakMinutes = useFocusStore((s) => s.breakMinutes);
  const targetCycles = useFocusStore((s) => s.targetCycles);
  const alertMode = useFocusStore((s) => s.alertMode);
  const setConfig = useFocusStore((s) => s.setConfig);
  const resetSession = useFocusStore((s) => s.resetSession);
  const running = useFocusStore((s) => s.running);

  return (
    <section
      className="min-w-0 overflow-hidden rounded-2xl border border-bloom-100 bg-surface p-5 shadow-sm"
      aria-labelledby="routine-card-heading"
    >
      <h3 id="routine-card-heading" className="text-base font-bold text-ink">
        Rotina equilibrada ♡
      </h3>
      <p className="mt-2 text-sm text-muted">
        Duração, pausas, ciclos e alerta ao terminar
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block min-w-0 text-sm">
          <span className="mb-1 block font-medium text-ink">
            Foco (min)
          </span>
          <input
            type="number"
            min={1}
            max={180}
            step={1}
            inputMode="numeric"
            value={durationMinutes}
            disabled={running}
            aria-describedby="routine-focus-hint"
            onChange={(e) => {
              const value = readNumberInput(e.target.value);
              if (value === null) return;
              setConfig({ durationMinutes: value });
            }}
            className={formControlClassName}
          />
        </label>
        <label className="block min-w-0 text-sm">
          <span className="mb-1 block font-medium text-ink">
            Pausa (min)
          </span>
          <input
            type="number"
            min={1}
            max={60}
            step={1}
            inputMode="numeric"
            value={breakMinutes}
            disabled={running}
            onChange={(e) => {
              const value = readNumberInput(e.target.value);
              if (value === null) return;
              setConfig({ breakMinutes: value });
            }}
            className={formControlClassName}
          />
        </label>
        <label className="block min-w-0 text-sm">
          <span className="mb-1 block font-medium text-ink">Ciclos</span>
          <input
            type="number"
            min={1}
            max={12}
            step={1}
            inputMode="numeric"
            value={targetCycles}
            disabled={running}
            onChange={(e) => {
              const value = readNumberInput(e.target.value);
              if (value === null) return;
              setConfig({ targetCycles: value });
            }}
            className={formControlClassName}
          />
        </label>
        <label className="block min-w-0 text-sm">
          <span className="mb-1 block font-medium text-ink">
            Ao terminar
          </span>
          <select
            value={alertMode}
            disabled={running}
            aria-label="Modo de alerta ao terminar a fase"
            onChange={(e) =>
              setConfig({ alertMode: e.target.value as FocusAlertMode })
            }
            className={formControlClassName}
          >
            {ALERT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p id="routine-focus-hint" className="sr-only">
        Valores entre 1 e 180 minutos. Campos bloqueados enquanto o timer
        estiver em execução.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="max-w-full truncate rounded-full bg-pastel-mint px-3 py-1.5 text-xs font-semibold text-ink">
          Pausas de {breakMinutes} min
        </span>
        <span className="max-w-full truncate rounded-full bg-pastel-lavender px-3 py-1.5 text-xs font-semibold text-ink">
          {ALERT_OPTIONS.find((o) => o.value === alertMode)?.label}
        </span>
      </div>

      <button
        type="button"
        onClick={() => resetSession()}
        disabled={running}
        className="mt-4 min-h-11 w-full rounded-xl border border-bloom-200 px-4 py-2.5 text-sm font-semibold text-ink hover:bg-bloom-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bloom-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Zerar ciclos da sessão
      </button>
    </section>
  );
}
