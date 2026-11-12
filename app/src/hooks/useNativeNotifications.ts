/**
 * Agenda/exibe alertas nativos enquanto o app está aberto.
 * Respeita useSettingsStore.notifications; no-op no browser.
 */

import { useEffect } from "react";
import { listCalendarEvents } from "../services/calendar";
import {
  isTauriRuntime,
  notifyFocusComplete,
  syncScheduledAlerts,
} from "../services/notifications";
import { listReminders } from "../services/reminders";
import { listTasks } from "../services/tasks";
import { useFocusStore } from "../stores/focusStore";
import { useSettingsStore } from "../stores/settingsStore";

const POLL_MS = 30_000;

export function useNativeNotifications(): void {
  const prefs = useSettingsStore((s) => s.notifications);

  // Lembretes / tarefas / calendário
  useEffect(() => {
    if (!isTauriRuntime()) return;

    let cancelled = false;

    const tick = async () => {
      if (cancelled) return;
      try {
        const [reminders, tasks, events] = await Promise.all([
          listReminders(),
          listTasks(),
          listCalendarEvents(),
        ]);
        if (cancelled) return;
        await syncScheduledAlerts(prefs, { reminders, tasks, events });
      } catch {
        // falha de dados / plugin — silencioso
      }
    };

    void tick();
    const id = window.setInterval(() => void tick(), POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [prefs]);

  // Fim de ciclo de foco
  useEffect(() => {
    if (!isTauriRuntime()) return;
    if (!prefs.focusAlerts) return;

    let prev = useFocusStore.getState().completedCycles;

    const unsub = useFocusStore.subscribe((state) => {
      if (state.completedCycles <= prev) {
        prev = state.completedCycles;
        return;
      }
      const cycle = state.completedCycles;
      const target = state.targetCycles;
      prev = cycle;
      void notifyFocusComplete(cycle, target);
    });

    return unsub;
  }, [prefs.focusAlerts]);
}
