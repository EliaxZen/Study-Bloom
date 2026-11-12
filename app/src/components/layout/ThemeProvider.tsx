import { useEffect } from "react";
import { applyModeToDocument } from "../../lib/themeApply";
import { useThemeStore } from "../../stores/themeStore";

/**
 * Hidrata prefs e mantém <html class="dark"> alinhado a
 * mode (light | dark | system) + prefers-color-scheme.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const mode = useThemeStore((s) => s.mode);
  const hydrate = useThemeStore((s) => s.hydrate);
  const reapplyAccent = useThemeStore((s) => s.reapplyAccent);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    applyModeToDocument(mode);
    reapplyAccent();

    if (mode !== "system") return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      applyModeToDocument("system");
      reapplyAccent();
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [mode, reapplyAccent]);

  return children;
}
