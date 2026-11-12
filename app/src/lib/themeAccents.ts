/**
 * Alias de compatibilidade — API canônica em ./themeAccent.
 */

export {
  ACCENT_PRESETS,
  DEFAULT_ACCENT_HEX as DEFAULT_ACCENT,
  DEFAULT_ACCENT_PRESET_ID,
  applyAccentCssVars as applyAccentToDocument,
  isAccentPresetId as isAccentId,
  type AccentPresetId as AccentId,
  type AccentPreset,
  type BloomScale,
} from "./themeAccent";
