import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Pause, Play, RotateCcw } from "lucide-react";
import {
  pressable,
  pressableReduced,
  useReducedMotionPreference,
} from "../../lib/motion";
import {
  useFocusStore,
  type FocusAlertMode,
  type FocusPhase,
} from "../../stores/focusStore";

type FocusTimerProps = {
  durationMinutes: number;
  completedCycles: number;
  targetCycles: number;
};

function formatSeconds(total: number) {
  const safe = Number.isFinite(total) ? Math.max(0, Math.floor(total)) : 0;
  const m = Math.floor(safe / 60)
    .toString()
    .padStart(2, "0");
  const s = (safe % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

/** Sobrevive a remount do Strict Mode — evita beep/notify duplicados */
let lastHandledPhaseEndSignal = 0;

/** Contexto compartilhado — criado no gesto "Iniciar" p/ beep não morrer no autoplay */
let sharedAudioCtx: AudioContext | null = null;

function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

function getAudioContextCtor(): typeof AudioContext | null {
  return (
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext ||
    null
  );
}

/** Chamar no clique de Iniciar — destrava AudioContext + pede permissão de notify */
function unlockFocusAlerts(mode: FocusAlertMode) {
  try {
    if (mode === "sound" || mode === "both") {
      const Ctx = getAudioContextCtor();
      if (Ctx) {
        if (!sharedAudioCtx || sharedAudioCtx.state === "closed") {
          sharedAudioCtx = new Ctx();
        }
        void sharedAudioCtx.resume();
      }
    }
  } catch {
    // ignore
  }

  if (mode === "notify" || mode === "both") {
    void (async () => {
      try {
        if (isTauriRuntime()) {
          const { isPermissionGranted, requestPermission } = await import(
            "@tauri-apps/plugin-notification"
          );
          const granted = await isPermissionGranted();
          if (!granted) await requestPermission();
          return;
        }
        if ("Notification" in window && Notification.permission === "default") {
          await Notification.requestPermission();
        }
      } catch {
        // ignore
      }
    })();
  }
}

function playFocusBeep() {
  try {
    const Ctx = getAudioContextCtor();
    if (!Ctx) return;
    if (!sharedAudioCtx || sharedAudioCtx.state === "closed") {
      sharedAudioCtx = new Ctx();
    }
    const ctx = sharedAudioCtx;
    const run = () => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 880;
      gain.gain.value = 0.0001;
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;
      gain.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
      osc.start(now);
      osc.stop(now + 0.5);
    };
    if (ctx.state === "suspended") {
      void ctx.resume().then(run).catch(() => {});
    } else {
      run();
    }
  } catch {
    // Som opcional — falha silenciosa (autoplay / contexto)
  }
}

async function sendFocusNotification(title: string, body: string) {
  try {
    if (isTauriRuntime()) {
      const {
        isPermissionGranted,
        requestPermission,
        sendNotification,
      } = await import("@tauri-apps/plugin-notification");
      let granted = await isPermissionGranted();
      if (!granted) {
        const permission = await requestPermission();
        granted = permission === "granted";
      }
      if (!granted) return;
      sendNotification({ title, body });
      return;
    }

    if (!("Notification" in window)) return;
    let permission = Notification.permission;
    if (permission === "default") {
      permission = await Notification.requestPermission();
    }
    if (permission !== "granted") return;
    new Notification(title, { body });
  } catch {
    // Notificação opcional
  }
}

function alertForPhaseEnd(
  endedPhase: FocusPhase,
  mode: FocusAlertMode,
  sessionComplete: boolean,
) {
  const title = sessionComplete
    ? "Sessão concluída ✿"
    : endedPhase === "focus"
      ? "Foco concluído ✿"
      : "Pausa concluída ♡";
  const body = sessionComplete
    ? "Você completou todos os ciclos de foco."
    : endedPhase === "focus"
      ? "Hora de uma pausinha."
      : "Pronto para o próximo ciclo de foco.";

  if (mode === "sound" || mode === "both") playFocusBeep();
  if (mode === "notify" || mode === "both") {
    void sendFocusNotification(title, body);
  }
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
  const phase = useFocusStore((s) => s.phase);
  const alertMode = useFocusStore((s) => s.alertMode);
  const phaseEndSignal = useFocusStore((s) => s.phaseEndSignal);
  const lastEndedPhase = useFocusStore((s) => s.lastEndedPhase);
  const lastSessionComplete = useFocusStore((s) => s.lastSessionComplete);
  const setRunning = useFocusStore((s) => s.setRunning);
  const tick = useFocusStore((s) => s.tick);
  const resetTimer = useFocusStore((s) => s.resetTimer);
  const reduced = useReducedMotionPreference();
  const press = reduced ? pressableReduced : pressable;
  const clickLock = useRef(false);

  useEffect(() => {
    hydrate({ durationMinutes, completedCycles, targetCycles });
  }, [hydrate, durationMinutes, completedCycles, targetCycles]);

  // Poll ~4x/s com base em endsAt (wall-clock) — setInterval(1000) sozinho driftava
  useEffect(() => {
    if (!running) return;
    tick();
    const id = window.setInterval(() => tick(), 250);
    return () => window.clearInterval(id);
  }, [running, tick]);

  useEffect(() => {
    if (phaseEndSignal === 0 || phaseEndSignal === lastHandledPhaseEndSignal) {
      return;
    }
    lastHandledPhaseEndSignal = phaseEndSignal;
    if (!lastEndedPhase) return;
    alertForPhaseEnd(lastEndedPhase, alertMode, lastSessionComplete);
  }, [phaseEndSignal, lastEndedPhase, lastSessionComplete, alertMode]);

  const withClickLock = (action: () => void) => {
    if (clickLock.current) return;
    clickLock.current = true;
    action();
    window.setTimeout(() => {
      clickLock.current = false;
    }, 200);
  };

  const toggleRunning = () => {
    withClickLock(() => {
      if (!running) unlockFocusAlerts(alertMode);
      setRunning(!running);
    });
  };

  // Não depende de lastSessionComplete (não é persistido) — sobrevive a reload
  const sessionComplete =
    !running && cycles >= target && target > 0 && phase === "focus";
  const phaseLabel = sessionComplete
    ? "Sessão concluída"
    : phase === "focus"
      ? "Foco"
      : "Pausa";

  return (
    <section
      className="min-w-0 overflow-hidden rounded-2xl border border-bloom-100 bg-surface p-5 text-center shadow-sm"
      aria-labelledby="focus-timer-heading"
    >
      <h3 id="focus-timer-heading" className="text-base font-bold text-ink">
        Hora de focar ✿
      </h3>
      <p className="mt-1 text-xs font-medium text-muted" aria-live="polite">
        Fase atual: {phaseLabel}
      </p>
      <p
        role="timer"
        aria-live="polite"
        aria-atomic="true"
        aria-label={`Tempo restante ${formatSeconds(secondsLeft)}`}
        className="mt-6 break-all text-4xl font-bold tracking-tight text-bloom-600 tabular-nums sm:text-5xl"
      >
        {formatSeconds(secondsLeft)}
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <motion.button
          type="button"
          onClick={toggleRunning}
          aria-pressed={running}
          aria-label={
            running ? "Pausar sessão de foco" : "Iniciar sessão de foco"
          }
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-bloom-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-bloom-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bloom-500"
          {...press}
        >
          {running ? (
            <Pause className="h-4 w-4 shrink-0" aria-hidden />
          ) : (
            <Play className="h-4 w-4 shrink-0" aria-hidden />
          )}
          {running ? "Pausar" : "Iniciar sessão"}
        </motion.button>
        <motion.button
          type="button"
          onClick={() => withClickLock(() => resetTimer())}
          aria-label="Reiniciar fase atual"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-bloom-200 bg-bloom-50 px-4 py-2.5 text-sm font-semibold text-ink hover:bg-bloom-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bloom-500"
          {...press}
        >
          <RotateCcw className="h-4 w-4 shrink-0" aria-hidden />
          Reiniciar
        </motion.button>
      </div>
      <p className="mt-3 text-xs text-muted">
        Ciclos de foco: {cycles} / {target}
      </p>
    </section>
  );
}
