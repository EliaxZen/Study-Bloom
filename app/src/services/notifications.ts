/**
 * Notificações nativas (Windows via tauri-plugin-notification)
 * -----------------------------------------------------------
 * No desktop o plugin só exibe na hora — o agendamento é feito em JS.
 * Em browser (web-only) tudo vira no-op silencioso.
 */

import type { CalendarEvent, Reminder, Task } from "../types";
import type { NotificationPrefs } from "../stores/settingsStore";

const FIRED_STORAGE_KEY = "study-bloom-notified";
/** Janela pós-evento: ainda alerta se o app abriu até 1h depois */
const PAST_GRACE_MS = 60 * 60 * 1000;
/** Hora padrão para datas sem horário (YYYY-MM-DD) */
const DATE_ONLY_HOUR = 9;

export function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

function loadFired(): Set<string> {
  try {
    const raw = localStorage.getItem(FIRED_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? new Set(parsed.map(String)) : new Set();
  } catch {
    return new Set();
  }
}

function saveFired(fired: Set<string>): void {
  try {
    // Mantém só as últimas ~200 chaves
    const list = [...fired].slice(-200);
    localStorage.setItem(FIRED_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // quota / private mode — ok
  }
}

function parseEventDate(iso: string): Date | null {
  const trimmed = iso.trim();
  if (!trimmed) return null;

  // Data pura → 09:00 local
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const d = new Date(
      `${trimmed}T${String(DATE_ONLY_HOUR).padStart(2, "0")}:00:00`,
    );
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const d = new Date(trimmed);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** true se já passou o momento do alerta e o evento ainda está na janela útil */
export function shouldFireAlert(
  eventIso: string,
  minutesBefore: number,
  now = new Date(),
): boolean {
  const eventAt = parseEventDate(eventIso);
  if (!eventAt) return false;

  const alertAt = new Date(eventAt.getTime() - minutesBefore * 60_000);
  if (now.getTime() < alertAt.getTime()) return false;
  if (now.getTime() > eventAt.getTime() + PAST_GRACE_MS) return false;
  return true;
}

let permissionReady: Promise<boolean> | null = null;

async function ensurePermission(): Promise<boolean> {
  if (!isTauriRuntime()) return false;
  if (!permissionReady) {
    permissionReady = (async () => {
      try {
        const {
          isPermissionGranted,
          requestPermission,
        } = await import("@tauri-apps/plugin-notification");
        let granted = await isPermissionGranted();
        if (!granted) {
          const result = await requestPermission();
          granted = result === "granted";
        }
        return granted;
      } catch {
        return false;
      }
    })();
  }
  return permissionReady;
}

/**
 * Mostra uma notificação nativa uma única vez por `key`.
 * No-op fora do Tauri ou sem permissão.
 */
export async function showNativeNotification(options: {
  key: string;
  title: string;
  body: string;
}): Promise<boolean> {
  if (!isTauriRuntime()) return false;

  const fired = loadFired();
  if (fired.has(options.key)) return false;

  const granted = await ensurePermission();
  if (!granted) return false;

  try {
    const { sendNotification } = await import(
      "@tauri-apps/plugin-notification"
    );
    sendNotification({ title: options.title, body: options.body });
    fired.add(options.key);
    saveFired(fired);
    return true;
  } catch {
    return false;
  }
}

export async function notifyFocusComplete(cycle: number, target: number): Promise<void> {
  await showNativeNotification({
    key: `focus:${cycle}:${target}:${new Date().toISOString().slice(0, 16)}`,
    title: "Foco concluído ✿",
    body:
      cycle >= target
        ? `Você completou ${cycle} ciclos. Bom descanso!`
        : `Ciclo ${cycle} de ${target} finalizado. Continue assim!`,
  });
}

export type AlertSources = {
  reminders: Reminder[];
  tasks: Task[];
  events: CalendarEvent[];
};

/** Avalia lembretes, vencimentos e eventos conforme as prefs. */
export async function syncScheduledAlerts(
  prefs: NotificationPrefs,
  sources: AlertSources,
  now = new Date(),
): Promise<void> {
  if (!isTauriRuntime()) return;

  const anyOn =
    prefs.reminders || prefs.calendarAlerts || prefs.focusAlerts;
  if (!anyOn) return;

  // Pede permissão cedo se algum alerta está ligado
  const granted = await ensurePermission();
  if (!granted) return;

  const minutes = Math.max(0, prefs.minutesBefore ?? 15);

  if (prefs.reminders) {
    for (const reminder of sources.reminders) {
      if (reminder.completed) continue;
      if (!shouldFireAlert(reminder.datetime, minutes, now)) continue;
      await showNativeNotification({
        key: `reminder:${reminder.id}:${reminder.datetime}`,
        title: "Lembrete — Study Bloom",
        body: reminder.title,
      });
    }
  }

  if (prefs.calendarAlerts) {
    for (const task of sources.tasks) {
      if (!task.dueDate || task.status === "done") continue;
      if (!shouldFireAlert(task.dueDate, minutes, now)) continue;
      await showNativeNotification({
        key: `task:${task.id}:${task.dueDate}`,
        title: "Tarefa a vencer",
        body: task.title,
      });
    }

    for (const event of sources.events) {
      if (!shouldFireAlert(event.date, minutes, now)) continue;
      await showNativeNotification({
        key: `event:${event.id}:${event.date}`,
        title: "Evento no calendário",
        body: event.title,
      });
    }
  }
}
