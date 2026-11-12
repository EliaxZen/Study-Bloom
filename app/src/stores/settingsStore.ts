/**
 * Preferências do app (pesos + notificações).
 * Persistidas no localStorage — tema (mode/accent) fica no themeStore.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type NotificationPrefs = {
  reminders: boolean;
  focusAlerts: boolean;
  calendarAlerts: boolean;
  minutesBefore: number;
};

export type GradeWeights = {
  assessment1: number;
  assessment2: number;
};

type SettingsState = {
  gradeWeights: GradeWeights;
  notifications: NotificationPrefs;
  setGradeWeights: (weights: GradeWeights) => void;
  setNotifications: (prefs: Partial<NotificationPrefs>) => void;
};

const DEFAULT_WEIGHTS: GradeWeights = { assessment1: 50, assessment2: 50 };
const DEFAULT_NOTIFICATIONS: NotificationPrefs = {
  reminders: true,
  focusAlerts: true,
  calendarAlerts: true,
  minutesBefore: 15,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      gradeWeights: DEFAULT_WEIGHTS,
      notifications: DEFAULT_NOTIFICATIONS,
      setGradeWeights: (gradeWeights) => set({ gradeWeights }),
      setNotifications: (prefs) =>
        set((state) => ({
          notifications: { ...state.notifications, ...prefs },
        })),
    }),
    {
      name: "study-bloom-settings",
      partialize: (state) => ({
        gradeWeights: state.gradeWeights,
        notifications: state.notifications,
      }),
    },
  ),
);
