import { useEffect } from "react";
import { motion } from "motion/react";
import { Pause, Play } from "lucide-react";
import {
  pressable,
  pressableReduced,
  useReducedMotionPreference,
} from "../../lib/motion";
import { useFocusStore } from "../../stores/focusStore";

type FocusTimerProps = {
  durationMinutes: number;
  completedCycles: number;
  targetCycles: number;
};

function formatSeconds(total: number) {
  const m = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const s = (total % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function FocusTimer({
  durationMinutes,
  completedCycles,
  targetCycles,
}: FocusTimerProps) {
  const hydrate = useFocusStore((s) => s.hydrate);
  const secondsLeft = useFocusStore((s) => s.secondsLeft);
  const running = useFocusStore((s) => s.running);
  const cycles = useFocusStore((s) => s.completedCycles);
  const target = useFocusStore((s) => s.targetCycles);
  const setRunning = useFocusStore((s) => s.setRunning);
  const tick = useFocusStore((s) => s.tick);
  const reduced = useReducedMotionPreference();
  const press = reduced ? pressableReduced : pressable;

  useEffect(() => {
    hydrate({ durationMinutes, completedCycles, targetCycles });
  }, [hydrate, durationMinutes, completedCycles, targetCycles]);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => tick(), 1000);
    return () => window.clearInterval(id);
  }, [running, tick]);

  return (
    <section className="rounded-2xl border border-bloom-100 bg-surface p-5 text-center shadow-sm">
      <h3 className="text-base font-bold text-ink">Hora de focar ✿</h3>
      <p className="mt-6 text-5xl font-bold tracking-tight text-bloom-600">
        {formatSeconds(secondsLeft)}
      </p>
      <motion.button
        type="button"
        onClick={() => setRunning(!running)}
        aria-pressed={running}
        className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-bloom-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-bloom-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bloom-500"
        {...press}
      >
        {running ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
        {running ? "Pausar" : "Iniciar sessão"}
      </motion.button>
      <p className="mt-3 text-xs text-muted">
        Ciclos de foco: {cycles} / {target}
      </p>
    </section>
  );
}
