/**
 * Persistência de tema (accent + mode)
 * ------------------------------------
 * Ordem: SQLite (settings / theme_prefs) → plugin-store → localStorage.
 */

import {
  ACCENT_PRESETS,
  DEFAULT_ACCENT_HEX,
  DEFAULT_ACCENT_PRESET_ID,
  isAccentPresetId,
  type AccentPresetId,
} from "../lib/themeAccent";

export type ThemeMode = "light" | "dark" | "system";

export type ThemePrefs = {
  presetId: AccentPresetId;
  hex: string;
  mode: ThemeMode;
};

const STORE_FILE = "settings.json";
const STORE_KEY = "theme";
const SETTINGS_KV_KEY = "theme.prefs";
const LS_KEY = "study-bloom-theme-prefs";

export const DEFAULT_THEME_PREFS: ThemePrefs = {
  presetId: DEFAULT_ACCENT_PRESET_ID,
  hex: DEFAULT_ACCENT_HEX,
  mode: "system",
};

function isThemeMode(value: unknown): value is ThemeMode {
  return value === "light" || value === "dark" || value === "system";
}

export function normalizeThemePrefs(raw: unknown): ThemePrefs {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_THEME_PREFS };
  const obj = raw as Record<string, unknown>;
  const presetId = isAccentPresetId(obj.presetId)
    ? obj.presetId
    : DEFAULT_ACCENT_PRESET_ID;
  return {
    presetId,
    hex: typeof obj.hex === "string" ? obj.hex : DEFAULT_ACCENT_HEX,
    mode: isThemeMode(obj.mode) ? obj.mode : "system",
  };
}

function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

function readLocalCache(): ThemePrefs | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return normalizeThemePrefs(JSON.parse(raw));
  } catch {
    return null;
  }
}

function writeLocalCache(prefs: ThemePrefs): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}

export function peekThemePrefs(): ThemePrefs {
  return readLocalCache() ?? { ...DEFAULT_THEME_PREFS };
}

async function loadFromSqlite(): Promise<ThemePrefs | null> {
  if (!isTauriRuntime()) return null;
  try {
    const { getDatabase } = await import("./database");
    const database = await getDatabase();

    await database.execute(`
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
    `);

    const rows = await database.select<{ value: string }[]>(
      "SELECT value FROM app_settings WHERE key = $1 LIMIT 1",
      [SETTINGS_KV_KEY],
    );
    if (rows[0]?.value) {
      return normalizeThemePrefs(JSON.parse(rows[0].value));
    }

    const prefsRows = await database.select<
      { mode: string; accent: string }[]
    >("SELECT mode, accent FROM theme_prefs WHERE id = $1 LIMIT 1", [
      "default",
    ]);
    const row = prefsRows[0];
    if (!row) return null;

    // accent na tabela pode ser preset id ou hex legado
    if (isAccentPresetId(row.accent) && row.accent !== "custom") {
      const preset = ACCENT_PRESETS.find((p) => p.id === row.accent);
      return normalizeThemePrefs({
        presetId: row.accent,
        hex: preset?.hex ?? DEFAULT_ACCENT_HEX,
        mode: row.mode,
      });
    }
    return normalizeThemePrefs({
      presetId: "custom",
      hex: row.accent,
      mode: row.mode,
    });
  } catch {
    return null;
  }
}

async function saveToSqlite(prefs: ThemePrefs): Promise<boolean> {
  if (!isTauriRuntime()) return false;
  try {
    const { getDatabase } = await import("./database");
    const database = await getDatabase();
    const payload = JSON.stringify(prefs);

    await database.execute(`
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
    `);
    await database.execute(
      `INSERT INTO app_settings (key, value) VALUES ($1, $2)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      [SETTINGS_KV_KEY, payload],
    );

    await database.execute(
      `INSERT INTO theme_prefs (id, mode, accent) VALUES ($1, $2, $3)
       ON CONFLICT(id) DO UPDATE SET mode = excluded.mode, accent = excluded.accent`,
      ["default", prefs.mode, prefs.presetId === "custom" ? prefs.hex : prefs.presetId],
    );
    return true;
  } catch {
    return false;
  }
}

async function loadFromPluginStore(): Promise<ThemePrefs | null> {
  if (!isTauriRuntime()) return null;
  try {
    const { load } = await import("@tauri-apps/plugin-store");
    const store = await load(STORE_FILE);
    const stored = await store.get<unknown>(STORE_KEY);
    if (stored === undefined || stored === null) return null;
    return normalizeThemePrefs(stored);
  } catch {
    return null;
  }
}

async function saveToPluginStore(prefs: ThemePrefs): Promise<boolean> {
  if (!isTauriRuntime()) return false;
  try {
    const { load } = await import("@tauri-apps/plugin-store");
    const store = await load(STORE_FILE);
    await store.set(STORE_KEY, prefs);
    await store.save();
    return true;
  } catch {
    return false;
  }
}

export async function loadThemePrefs(): Promise<ThemePrefs> {
  const fromSql = await loadFromSqlite();
  if (fromSql) {
    writeLocalCache(fromSql);
    return fromSql;
  }

  const fromStore = await loadFromPluginStore();
  if (fromStore) {
    writeLocalCache(fromStore);
    return fromStore;
  }

  return readLocalCache() ?? { ...DEFAULT_THEME_PREFS };
}

export async function saveThemePrefs(prefs: ThemePrefs): Promise<void> {
  const normalized = normalizeThemePrefs(prefs);
  writeLocalCache(normalized);
  const okSql = await saveToSqlite(normalized);
  if (!okSql) {
    await saveToPluginStore(normalized);
  }
}
