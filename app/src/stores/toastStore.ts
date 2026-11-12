import { create } from "zustand";

type ToastState = {
  message: string | null;
  /** Id crescente para o AnimatePresence remountar mesmo com texto igual */
  toastId: number;
  show: (message: string) => void;
  clear: () => void;
};

let hideTimer: ReturnType<typeof setTimeout> | null = null;
let nextId = 0;

/** Toast mínimo para CTAs ainda sem formulário */
export const useToastStore = create<ToastState>((set) => ({
  message: null,
  toastId: 0,
  show: (message) => {
    if (hideTimer) clearTimeout(hideTimer);
    nextId += 1;
    set({ message, toastId: nextId });
    hideTimer = setTimeout(() => set({ message: null }), 2800);
  },
  clear: () => {
    if (hideTimer) clearTimeout(hideTimer);
    set({ message: null });
  },
}));
