import { Monitor, Moon, Sun } from "lucide-react";
import { motion } from "motion/react";
import {
  pressable,
  pressableReduced,
  useReducedMotionPreference,
} from "../../lib/motion";
import type { ThemeMode } from "../../services/themePersistence";
import { cn } from "../../lib/utils";
import { useThemeStore } from "../../stores/themeStore";

const OPTIONS: {
  value: ThemeMode;
  label: string;
  icon: typeof Sun;
}[] = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Escuro", icon: Moon },
  { value: "system", label: "Sistema", icon: Monitor },
];

export type ThemeToggleProps = {
  /** Só ícone — cicla light → dark → system. */
  compact?: boolean;
  className?: string;
  /** Modo controlado (ex.: rascunho em Configurações). */
  draftMode?: ThemeMode;
  /** Se definido, não persiste — só notifica o pai. */
  onDraftChange?: (mode: ThemeMode) => void;
};

/**
 * Toggle claro / escuro / sistema.
 * Por padrão grava no themeStore (mode). Accent fica no mesmo store (P3).
 */
export function ThemeToggle({
  compact = false,
  className,
  draftMode,
  onDraftChange,
}: ThemeToggleProps) {
  const stored = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);
  const preference = draftMode ?? stored;
  const reduced = useReducedMotionPreference();
  const press = reduced ? pressableReduced : pressable;

  const select = (mode: ThemeMode) => {
    if (onDraftChange) {
      onDraftChange(mode);
      return;
    }
    void setMode(mode);
  };

  if (compact) {
    /* Compacto: só claro ↔ escuro (atalho rápido na sidebar) */
    const resolved =
      preference === "system"
        ? typeof window !== "undefined" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : preference;
    const next: ThemeMode = resolved === "dark" ? "light" : "dark";
    const Icon = resolved === "dark" ? Sun : Moon;

    return (
      <motion.button
        type="button"
        onClick={() => select(next)}
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-xl text-muted hover:bg-bloom-50 hover:text-ink sm:h-10 sm:w-10",
          className,
        )}
        aria-label={
          resolved === "dark"
            ? "Tema escuro. Alternar para claro"
            : "Tema claro. Alternar para escuro"
        }
        title={resolved === "dark" ? "Escuro" : "Claro"}
        {...press}
      >
        <Icon className="h-4 w-4" />
      </motion.button>
    );
  }

  return (
    <div
      className={cn("flex gap-1 rounded-xl bg-canvas/80 p-1", className)}
      role="group"
      aria-label="Tema da interface"
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = preference === value;
        return (
          <motion.button
            key={value}
            type="button"
            onClick={() => select(value)}
            className={cn(
              "relative flex min-h-9 flex-1 items-center justify-center gap-1 rounded-lg px-1.5 py-1.5 text-[0.7rem] font-semibold transition-colors",
              active ? "text-bloom-700" : "text-muted hover:text-ink",
            )}
            aria-pressed={active}
            title={label}
            {...press}
          >
            {active ? (
              <motion.span
                layoutId={reduced ? undefined : "theme-toggle-pill"}
                className="absolute inset-0 rounded-lg bg-surface shadow-sm"
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
                aria-hidden
              />
            ) : null}
            <Icon className="relative z-10 h-3.5 w-3.5 shrink-0" />
            <span className="relative z-10 truncate">{label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
