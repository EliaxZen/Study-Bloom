/**
 * Re-exports do modo claro/escuro (P4).
 * Preferir themeApply / themePersistence / themeStore diretamente.
 */

export {
  applyModeToDocument,
  resolveThemeMode,
} from "./themeApply";

export type { ThemeMode } from "../services/themePersistence";
