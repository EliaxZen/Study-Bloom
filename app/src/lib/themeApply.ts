/**
 * Aplica mode no documento (P4).
 * Reaplica acento depois do toggle .dark para soft stops dark-aware (P3).
 */

import { applyAccentCssVars } from "./themeAccent";
import type { ThemeMode } from "../services/themePersistence";

export function resolveThemeMode(mode: ThemeMode): "light" | "dark" {
  if (mode === "system") {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return mode;
}

export function applyModeToDocument(mode: ThemeMode): void {
  if (typeof document === "undefined") return;
  const resolved = resolveThemeMode(mode);
  const root = document.documentElement;
  const body = document.body;

  root.dataset.theme = resolved;
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;

  if (body) {
    body.dataset.theme = resolved;
    body.classList.toggle("dark", resolved === "dark");
  }

  const accentHex = root.dataset.accent;
  if (accentHex) applyAccentCssVars(accentHex);
}
