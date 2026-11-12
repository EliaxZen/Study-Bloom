/**
 * Store do tema — acento (P3) + mode claro/escuro (P4 compartilhado).
 * Persistência: themePersistence (SQLite → plugin-store → localStorage).
 */

import { create } from "zustand";
import {
  ACCENT_PRESETS,
  applyAccentCssVars,
  bootAccentFromLocalCache,
  DEFAULT_ACCENT_HEX,
  DEFAULT_ACCENT_PRESET_ID,
  matchPresetId,
  normalizeHex,
  resolvePresetHex,
  type AccentPresetId,
} from "../lib/themeAccent";
import { applyModeToDocument } from "../lib/themeApply";
import {
  loadThemePrefs,
  peekThemePrefs,
  saveThemePrefs,
  type ThemeMode,
} from "../services/themePersistence";

const boot = peekThemePrefs();
if (typeof document !== "undefined") {
  /* Accent depois do mode: soft stops dark-aware (removeProperty no dark) */
  applyModeToDocument(boot.mode);
  bootAccentFromLocalCache();
  applyAccentCssVars(resolvePresetHex(boot.presetId, boot.hex));
}

type ThemeState = {
  presetId: AccentPresetId;
  /** Alias de presetId (ThemeCustomizer / APIs legadas) */
  accent: AccentPresetId;
  accentHex: string;
  mode: ThemeMode;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setPreset: (id: Exclude<AccentPresetId, "custom">) => Promise<void>;
  setCustomHex: (hex: string) => Promise<void>;
  setMode: (mode: ThemeMode) => Promise<void>;
  setAccent: (id: Exclude<AccentPresetId, "custom">) => Promise<void>;
  resetTheme: () => Promise<void>;
  /** Reaplica CSS vars de acento após troca light/dark */
  reapplyAccent: () => void;
  toggleDarkShortcut: () => Promise<void>;
};

async function persistAll(
  presetId: AccentPresetId,
  hex: string,
  mode: ThemeMode,
): Promise<void> {
  applyModeToDocument(mode);
  applyAccentCssVars(hex);
  await saveThemePrefs({ presetId, hex, mode });
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  presetId: boot.presetId,
  accent: boot.presetId,
  accentHex: resolvePresetHex(boot.presetId, boot.hex),
  mode: boot.mode,
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;
    try {
      const saved = await loadThemePrefs();
      const hex = resolvePresetHex(saved.presetId, saved.hex);
      const presetId =
        saved.presetId === "custom" ? matchPresetId(hex) : saved.presetId;
      applyModeToDocument(saved.mode);
      applyAccentCssVars(hex);
      set({
        presetId,
        accent: presetId,
        accentHex: hex,
        mode: saved.mode,
        hydrated: true,
      });
    } catch {
      applyModeToDocument("system");
      applyAccentCssVars(DEFAULT_ACCENT_HEX);
      set({
        presetId: DEFAULT_ACCENT_PRESET_ID,
        accent: DEFAULT_ACCENT_PRESET_ID,
        accentHex: DEFAULT_ACCENT_HEX,
        mode: "system",
        hydrated: true,
      });
    }
  },

  reapplyAccent: () => {
    applyAccentCssVars(get().accentHex);
  },

  setPreset: async (id) => {
    const preset = ACCENT_PRESETS.find((p) => p.id === id);
    if (!preset) return;
    const { mode } = get();
    set({ presetId: id, accent: id, accentHex: preset.hex });
    await persistAll(id, preset.hex, mode);
  },

  setCustomHex: async (raw) => {
    const hex = normalizeHex(raw);
    if (!hex) return;
    const presetId = matchPresetId(hex);
    const { mode } = get();
    set({ presetId, accent: presetId, accentHex: hex });
    await persistAll(presetId, hex, mode);
  },

  setMode: async (mode) => {
    const { presetId, accentHex } = get();
    set({ mode });
    await persistAll(presetId, accentHex, mode);
  },

  setAccent: async (id) => get().setPreset(id),

  resetTheme: async () => {
    const { mode } = get();
    set({
      presetId: DEFAULT_ACCENT_PRESET_ID,
      accent: DEFAULT_ACCENT_PRESET_ID,
      accentHex: DEFAULT_ACCENT_HEX,
    });
    await persistAll(DEFAULT_ACCENT_PRESET_ID, DEFAULT_ACCENT_HEX, mode);
  },

  toggleDarkShortcut: async () => {
    const { mode } = get();
    const systemDark =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    const next: ThemeMode =
      mode === "dark"
        ? "light"
        : mode === "light"
          ? "dark"
          : systemDark
            ? "light"
            : "dark";
    await get().setMode(next);
  },
}));
