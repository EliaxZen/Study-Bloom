/**
 * Settings persistentes (chave/valor)
 * -----------------------------------
 * Ordem: SQLite → plugin-store → localStorage (dev/web).
 */

import type { ThemeAccentPersisted } from "../lib/themeAccent";
import {
  DEFAULT_ACCENT_HEX,
  DEFAULT_ACCENT_PRESET_ID,
  normalizeHex,
} from "../lib/themeAccent";

const THEME_ACCENT_KEY = "theme.accent";
const STORE_FILE = "settings.json";
const LS_PREFIX = "study-bloom:";

function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

async function ensureSettingsTable(): Promise<
  import("@tauri-apps/plugin-sql").default | null
> {
  if (!isTauriRuntime()) return null;
  try {
    const { getDatabase, initDatabase } = await import("./database");
    // Prefer boot já migrado; fallback abre e cria settings se preciso
    await initDatabase().catch(() => undefined);
    const database = await getDatabase();
    await database.execute(`
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
    `);
    return database;
  } catch {
    return null;
  }
}

async function getFromSqlite(key: string): Promise<string | null> {
  const database = await ensureSettingsTable();
  if (!database) return null;
  try {
    const rows = await database.select<{ value: string }[]>(
      "SELECT value FROM app_settings WHERE key = $1 LIMIT 1",
      [key],
    );
    return rows[0]?.value ?? null;
  } catch {
    return null;
  }
}

async function setInSqlite(key: string, value: string): Promise<boolean> {
  const database = await ensureSettingsTable();
  if (!database) return false;
  try {
    await database.execute(
      `INSERT INTO app_settings (key, value) VALUES ($1, $2)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      [key, value],
    );
    return true;
  } catch {
    return false;
  }
}

async function getFromPluginStore(key: string): Promise<string | null> {
  if (!isTauriRuntime()) return null;
  try {
    const { load } = await import("@tauri-apps/plugin-store");
    const store = await load(STORE_FILE);
    const value = await store.get<string>(key);
    return typeof value === "string" ? value : null;
  } catch {
    return null;
  }
}

async function setInPluginStore(key: string, value: string): Promise<boolean> {
  if (!isTauriRuntime()) return false;
  try {
    const { load } = await import("@tauri-apps/plugin-store");
    const store = await load(STORE_FILE);
    await store.set(key, value);
    await store.save();
    return true;
  } catch {
    return false;
  }
}

function getFromLocalStorage(key: string): string | null {
  try {
    return localStorage.getItem(`${LS_PREFIX}${key}`);
  } catch {
    return null;
  }
}

function setInLocalStorage(key: string, value: string): void {
  try {
    localStorage.setItem(`${LS_PREFIX}${key}`, value);
  } catch {
    /* ignore quota / private mode */
  }
}

/** Lê string; SQLite → plugin-store → localStorage. */
export async function getSetting(key: string): Promise<string | null> {
  const fromSql = await getFromSqlite(key);
  if (fromSql != null) return fromSql;

  const fromStore = await getFromPluginStore(key);
  if (fromStore != null) return fromStore;

  return getFromLocalStorage(key);
}

/** Grava: tenta SQLite; se falhar, plugin-store; sempre espelha localStorage. */
export async function setSetting(key: string, value: string): Promise<void> {
  const okSql = await setInSqlite(key, value);
  if (!okSql) {
    await setInPluginStore(key, value);
  }
  setInLocalStorage(key, value);
}

function parseThemeAccent(raw: string | null): ThemeAccentPersisted {
  if (!raw) {
    return { presetId: DEFAULT_ACCENT_PRESET_ID, hex: DEFAULT_ACCENT_HEX };
  }
  try {
    const parsed = JSON.parse(raw) as Partial<ThemeAccentPersisted>;
    const hex = normalizeHex(String(parsed.hex ?? "")) ?? DEFAULT_ACCENT_HEX;
    const presetId =
      parsed.presetId === "lavender" ||
      parsed.presetId === "rose" ||
      parsed.presetId === "mint" ||
      parsed.presetId === "peach" ||
      parsed.presetId === "sky" ||
      parsed.presetId === "custom"
        ? parsed.presetId
        : "custom";
    return { presetId, hex };
  } catch {
    const hex = normalizeHex(raw) ?? DEFAULT_ACCENT_HEX;
    return { presetId: "custom", hex };
  }
}

export async function loadThemeAccent(): Promise<ThemeAccentPersisted> {
  const raw = await getSetting(THEME_ACCENT_KEY);
  return parseThemeAccent(raw);
}

export async function saveThemeAccent(
  value: ThemeAccentPersisted,
): Promise<void> {
  await setSetting(THEME_ACCENT_KEY, JSON.stringify(value));
}
