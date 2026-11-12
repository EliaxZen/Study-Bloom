import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type FocusPhase = "focus" | "break";
export type FocusAlertMode = "sound" | "notify" | "both";

export type FocusConfig = {
  durationMinutes: number;
  breakMinutes: number;
  targetCycles: number;
  alertMode: FocusAlertMode;
};

type FocusState = FocusConfig & {
  completedCycles: number;
  secondsLeft: number;
  /** Epoch ms em que a fase atual chega a zero — base anti-drift */
  endsAt: number | null;
  running: boolean;
  phase: FocusPhase;
  /** Incrementa a cada fim de fase — UI reage para som/notificação */
  phaseEndSignal: number;
  lastEndedPhase: FocusPhase | null;
  /** true quando o último fim de fase encerrou a sessão completa */
  lastSessionComplete: boolean;
  hydrate: (input: {
    durationMinutes: number;
    targetCycles: number;
    completedCycles: number;
  }) => void;
  setConfig: (partial: Partial<FocusConfig>) => void;
  setRunning: (running: boolean) => void;
  tick: () => void;
  resetTimer: () => void;
  resetSession: () => void;
};

const ALERT_MODES: FocusAlertMode[] = ["sound", "notify", "both"];

const FACTORY = {
  durationMinutes: 25,
  breakMinutes: 5,
  targetCycles: 4,
  alertMode: "both" as FocusAlertMode,
};

function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

function normalizeAlertMode(value: unknown, fallback: FocusAlertMode): FocusAlertMode {
  return ALERT_MODES.includes(value as FocusAlertMode)
    ? (value as FocusAlertMode)
    : fallback;
}

function normalizePhase(value: unknown, fallback: FocusPhase): FocusPhase {
  return value === "focus" || value === "break" ? value : fallback;
}

function phaseSeconds(phase: FocusPhase, config: FocusConfig): number {
  const minutes =
    phase === "focus" ? config.durationMinutes : config.breakMinutes;
  return minutes * 60;
}

function isFactoryConfig(config: FocusConfig): boolean {
  return (
    config.durationMinutes === FACTORY.durationMinutes &&
    config.breakMinutes === FACTORY.breakMinutes &&
    config.targetCycles === FACTORY.targetCycles &&
    config.alertMode === FACTORY.alertMode
  );
}

function remainingFromEndsAt(endsAt: number | null, fallback: number): number {
  if (endsAt == null) return fallback;
  return Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
}

function sanitizePersisted(
  persisted: Partial<FocusState> | undefined,
  current: FocusState,
): FocusState {
  if (!persisted) return current;

  const durationMinutes = clampInt(
    Number(persisted.durationMinutes),
    1,
    180,
  );
  const breakMinutes = clampInt(Number(persisted.breakMinutes), 1, 60);
  const targetCycles = clampInt(Number(persisted.targetCycles), 1, 12);
  const alertMode = normalizeAlertMode(persisted.alertMode, current.alertMode);
  const phase = normalizePhase(persisted.phase, current.phase);
  const completedCycles = clampInt(
    Number(persisted.completedCycles),
    0,
    targetCycles,
  );
  const fullPhase = phaseSeconds(phase, {
    durationMinutes,
    breakMinutes,
    targetCycles,
    alertMode,
  });
  const rawSeconds = Number(persisted.secondsLeft);
  const secondsLeft = Number.isFinite(rawSeconds)
    ? clampInt(rawSeconds, 0, fullPhase)
    : fullPhase;

  return {
    ...current,
    durationMinutes,
    breakMinutes,
    targetCycles,
    alertMode,
    completedCycles,
    secondsLeft,
    phase,
    endsAt: null,
    running: false,
    lastSessionComplete: false,
  };
}

/** localStorage com try/catch — evita quebrar persist se storage estiver bloqueado */
const safeFocusStorage = createJSONStorage(() => ({
  getItem: (name) => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value);
    } catch {
      // Storage cheio / bloqueado — UI continua em memória
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch {
      // ignore
    }
  },
}));

export const useFocusStore = create<FocusState>()(
  persist(
    (set, get) => ({
      durationMinutes: FACTORY.durationMinutes,
      breakMinutes: FACTORY.breakMinutes,
      targetCycles: FACTORY.targetCycles,
      alertMode: FACTORY.alertMode,
      completedCycles: 0,
      secondsLeft: FACTORY.durationMinutes * 60,
      endsAt: null,
      running: false,
      phase: "focus",
      phaseEndSignal: 0,
      lastEndedPhase: null,
      lastSessionComplete: false,
      hydrate: ({ durationMinutes, targetCycles, completedCycles }) => {
        const current = get();
        // Só semente da API se sessão ociosa no início E config ainda é a de fábrica.
        // Evita apagar duração/ciclos/alertas já persistidos pelo usuário.
        if (
          current.running ||
          current.completedCycles > 0 ||
          current.phase !== "focus" ||
          current.secondsLeft !== phaseSeconds(current.phase, current) ||
          !isFactoryConfig(current)
        ) {
          return;
        }
        const duration = clampInt(durationMinutes, 1, 180);
        const target = clampInt(targetCycles, 1, 12);
        set({
          durationMinutes: duration,
          targetCycles: target,
          completedCycles: clampInt(completedCycles, 0, target),
          secondsLeft: duration * 60,
          endsAt: null,
          running: false,
          phase: "focus",
          lastSessionComplete: false,
        });
      },
      setConfig: (partial) => {
        const current = get();
        const next: FocusConfig = {
          durationMinutes: clampInt(
            partial.durationMinutes ?? current.durationMinutes,
            1,
            180,
          ),
          breakMinutes: clampInt(
            partial.breakMinutes ?? current.breakMinutes,
            1,
            60,
          ),
          targetCycles: clampInt(
            partial.targetCycles ?? current.targetCycles,
            1,
            12,
          ),
          alertMode: normalizeAlertMode(
            partial.alertMode ?? current.alertMode,
            current.alertMode,
          ),
        };
        const atPhaseStart =
          !current.running &&
          current.secondsLeft === phaseSeconds(current.phase, current);
        const nextSeconds = atPhaseStart
          ? phaseSeconds(current.phase, next)
          : clampInt(
              current.secondsLeft,
              0,
              phaseSeconds(current.phase, next),
            );
        set({
          ...next,
          completedCycles: Math.min(current.completedCycles, next.targetCycles),
          secondsLeft: nextSeconds,
          endsAt:
            current.running && nextSeconds > 0
              ? Date.now() + nextSeconds * 1000
              : null,
        });
      },
      setRunning: (running) => {
        if (!running) {
          const state = get();
          const left = remainingFromEndsAt(state.endsAt, state.secondsLeft);
          set({ running: false, endsAt: null, secondsLeft: left });
          return;
        }
        const state = get();
        // Sessão já completa: reinicia ciclos antes de tocar de novo
        if (
          state.completedCycles >= state.targetCycles &&
          state.phase === "focus"
        ) {
          const seconds = phaseSeconds("focus", state);
          set({
            completedCycles: 0,
            phase: "focus",
            secondsLeft: seconds,
            endsAt: Date.now() + seconds * 1000,
            running: true,
            lastEndedPhase: null,
            lastSessionComplete: false,
          });
          return;
        }
        // 0 / corrompido: recarrega a fase atual em vez de travar o play
        const left =
          state.secondsLeft > 0
            ? state.secondsLeft
            : phaseSeconds(state.phase, state);
        set({
          running: true,
          secondsLeft: left,
          endsAt: Date.now() + left * 1000,
          lastSessionComplete: false,
        });
      },
      tick: () => {
        const state = get();
        if (!state.running) return;

        const left = remainingFromEndsAt(
          state.endsAt,
          Number.isFinite(state.secondsLeft) ? state.secondsLeft : 0,
        );

        if (left > 0) {
          if (left !== state.secondsLeft) {
            set({ secondsLeft: left });
          }
          return;
        }

        const endedPhase = state.phase;
        if (endedPhase === "focus") {
          const completed = Math.min(
            state.completedCycles + 1,
            state.targetCycles,
          );
          const sessionDone = completed >= state.targetCycles;
          const nextPhase: FocusPhase = sessionDone ? "focus" : "break";
          const nextSeconds = phaseSeconds(nextPhase, state);
          set({
            completedCycles: completed,
            phase: nextPhase,
            secondsLeft: nextSeconds,
            endsAt: sessionDone ? null : Date.now() + nextSeconds * 1000,
            running: !sessionDone,
            phaseEndSignal: state.phaseEndSignal + 1,
            lastEndedPhase: endedPhase,
            lastSessionComplete: sessionDone,
          });
          return;
        }

        const nextSeconds = phaseSeconds("focus", state);
        set({
          phase: "focus",
          secondsLeft: nextSeconds,
          endsAt: Date.now() + nextSeconds * 1000,
          running: true,
          phaseEndSignal: state.phaseEndSignal + 1,
          lastEndedPhase: endedPhase,
          lastSessionComplete: false,
        });
      },
      resetTimer: () => {
        const state = get();
        set({
          secondsLeft: phaseSeconds(state.phase, state),
          endsAt: null,
          running: false,
        });
      },
      resetSession: () => {
        const state = get();
        set({
          completedCycles: 0,
          phase: "focus",
          secondsLeft: phaseSeconds("focus", state),
          endsAt: null,
          running: false,
          lastEndedPhase: null,
          lastSessionComplete: false,
        });
      },
    }),
    {
      name: "study-bloom-focus",
      storage: safeFocusStorage,
      partialize: (state) => ({
        durationMinutes: state.durationMinutes,
        breakMinutes: state.breakMinutes,
        targetCycles: state.targetCycles,
        alertMode: state.alertMode,
        completedCycles: state.completedCycles,
        secondsLeft: state.secondsLeft,
        phase: state.phase,
        // Nunca restaura "running" / endsAt — evita timer fantasma após reload
      }),
      merge: (persisted, current) =>
        sanitizePersisted(
          persisted as Partial<FocusState> | undefined,
          current as FocusState,
        ),
    },
  ),
);
