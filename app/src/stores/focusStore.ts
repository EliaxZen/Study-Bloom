import { create } from "zustand";
import { persist } from "zustand/middleware";

type FocusState = {
  durationMinutes: number;
  targetCycles: number;
  completedCycles: number;
  secondsLeft: number;
  running: boolean;
  hydrate: (input: {
    durationMinutes: number;
    targetCycles: number;
    completedCycles: number;
  }) => void;
  setRunning: (running: boolean) => void;
  tick: () => void;
  resetTimer: () => void;
};

export const useFocusStore = create<FocusState>()(
  persist(
    (set, get) => ({
      durationMinutes: 25,
      targetCycles: 4,
      completedCycles: 0,
      secondsLeft: 25 * 60,
      running: false,
      hydrate: ({ durationMinutes, targetCycles, completedCycles }) => {
        const current = get();
        // Só hidrata se ainda não houve progresso local persistido
        if (current.completedCycles > 0 || current.secondsLeft !== current.durationMinutes * 60) {
          return;
        }
        set({
          durationMinutes,
          targetCycles,
          completedCycles,
          secondsLeft: durationMinutes * 60,
          running: false,
        });
      },
      setRunning: (running) => set({ running }),
      tick: () => {
        const { secondsLeft, completedCycles, targetCycles, durationMinutes } =
          get();
        if (secondsLeft <= 1) {
          set({
            running: false,
            secondsLeft: durationMinutes * 60,
            completedCycles: Math.min(completedCycles + 1, targetCycles),
          });
          return;
        }
        set({ secondsLeft: secondsLeft - 1 });
      },
      resetTimer: () => {
        const { durationMinutes } = get();
        set({ secondsLeft: durationMinutes * 60, running: false });
      },
    }),
    {
      name: "study-bloom-focus",
      partialize: (state) => ({
        durationMinutes: state.durationMinutes,
        targetCycles: state.targetCycles,
        completedCycles: state.completedCycles,
        secondsLeft: state.secondsLeft,
        // Nunca restaura "running" — evita timer fantasma após reload
      }),
    },
  ),
);
