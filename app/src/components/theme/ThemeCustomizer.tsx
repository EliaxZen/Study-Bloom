import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, X } from "lucide-react";
import {
  ACCENT_PRESETS,
  DEFAULT_ACCENT_HEX,
  normalizeHex,
} from "../../lib/themeAccent";
import {
  modalBackdropVariants,
  modalPanelVariants,
  modalPanelVariantsReduced,
  pressable,
  pressableReduced,
  useReducedMotionPreference,
} from "../../lib/motion";
import { cn } from "../../lib/utils";
import { useThemeStore } from "../../stores/themeStore";
import { useToastStore } from "../../stores/toastStore";

type ThemeCustomizerProps = {
  open: boolean;
  onClose: () => void;
};

/** Modal de accent pastel (P3). Claro/escuro fica no ThemeToggle (P4). */
export function ThemeCustomizer({ open, onClose }: ThemeCustomizerProps) {
  const reduced = useReducedMotionPreference();
  const press = reduced ? pressableReduced : pressable;
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const presetId = useThemeStore((s) => s.presetId);
  const accentHex = useThemeStore((s) => s.accentHex);
  const setPreset = useThemeStore((s) => s.setPreset);
  const setCustomHex = useThemeStore((s) => s.setCustomHex);
  const resetTheme = useThemeStore((s) => s.resetTheme);
  const showToast = useToastStore((s) => s.show);

  const [draftHex, setDraftHex] = useState(accentHex);

  useEffect(() => {
    if (open) setDraftHex(accentHex);
  }, [open, accentHex]);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    window.setTimeout(() => panelRef.current?.focus(), 0);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      previouslyFocused.current?.focus?.();
    };
  }, [open, onClose]);

  const pickPreset = async (id: (typeof ACCENT_PRESETS)[number]["id"]) => {
    await setPreset(id);
    const label = ACCENT_PRESETS.find((p) => p.id === id)?.label ?? id;
    showToast(`Tema ${label} aplicado ✿`);
  };

  const applyCustom = async () => {
    const hex = normalizeHex(draftHex);
    if (!hex) {
      showToast("Cor inválida — use #RRGGBB");
      return;
    }
    await setCustomHex(hex);
    showToast("Cor personalizada aplicada ✿");
  };

  const restore = async () => {
    await resetTheme();
    setDraftHex(DEFAULT_ACCENT_HEX);
    showToast("Tema padrão (lavanda) restaurado");
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="theme-customizer"
          className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0.1 : 0.18 }}
        >
          <motion.button
            type="button"
            className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]"
            aria-label="Fechar"
            onClick={onClose}
            variants={modalBackdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-t-2xl border border-bloom-100 bg-surface p-4 shadow-xl outline-none sm:rounded-2xl sm:p-5"
            variants={
              reduced ? modalPanelVariantsReduced : modalPanelVariants
            }
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 id={titleId} className="text-lg font-bold text-ink">
                  Personalizar tema
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Accent pastel da marca. Claro/escuro fica no atalho ao lado.
                </p>
              </div>
              <motion.button
                type="button"
                onClick={onClose}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-bloom-50 text-muted hover:bg-bloom-100 hover:text-ink sm:h-8 sm:w-8"
                aria-label="Fechar"
                {...press}
              >
                <X className="h-4 w-4" />
              </motion.button>
            </div>

            <div
              className="grid grid-cols-5 gap-2 sm:gap-3"
              role="listbox"
              aria-label="Cores de accent"
            >
              {ACCENT_PRESETS.map((preset) => {
                const selected = presetId === preset.id;
                return (
                  <motion.button
                    key={preset.id}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    aria-label={preset.label}
                    title={preset.label}
                    onClick={() => void pickPreset(preset.id)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-xl p-2 transition",
                      selected
                        ? "bg-bloom-50 ring-2 ring-bloom-400"
                        : "hover:bg-bloom-50/70",
                    )}
                    {...press}
                  >
                    <span
                      className="relative flex h-10 w-10 items-center justify-center rounded-full shadow-sm ring-2 ring-white"
                      style={{ backgroundColor: preset.hex }}
                    >
                      {selected ? (
                        <Check
                          className="h-4 w-4 text-white drop-shadow"
                          aria-hidden
                        />
                      ) : null}
                    </span>
                    <span className="text-[11px] font-medium text-ink">
                      {preset.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            <div className="mt-4 rounded-xl border border-bloom-100 bg-bloom-50/50 p-3">
              <label
                htmlFor="accent-hex"
                className="text-xs font-semibold text-bloom-700"
              >
                Cor customizada
              </label>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="color"
                  aria-label="Seletor de cor"
                  value={normalizeHex(draftHex) ?? DEFAULT_ACCENT_HEX}
                  onChange={(e) => {
                    setDraftHex(e.target.value);
                    void setCustomHex(e.target.value);
                  }}
                  className="h-10 w-12 cursor-pointer rounded-lg border border-bloom-200 bg-surface p-1"
                />
                <input
                  id="accent-hex"
                  value={draftHex}
                  onChange={(e) => setDraftHex(e.target.value)}
                  onBlur={() => void applyCustom()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void applyCustom();
                    }
                  }}
                  placeholder="#7c5fbd"
                  spellCheck={false}
                  className="min-h-11 flex-1 rounded-xl border border-bloom-200 bg-surface px-3 py-2 font-mono text-sm text-ink outline-none focus:border-bloom-400 sm:min-h-0"
                />
                <motion.button
                  type="button"
                  onClick={() => void applyCustom()}
                  className="min-h-11 rounded-xl bg-bloom-600 px-3 py-2 text-sm font-semibold text-white hover:bg-bloom-700 sm:min-h-0"
                  {...press}
                >
                  Aplicar
                </motion.button>
              </div>
              {presetId === "custom" ? (
                <p className="mt-2 text-[11px] text-muted">
                  Accent custom ativo: {accentHex}
                </p>
              ) : null}
            </div>

            <div
              className="mt-4 overflow-hidden rounded-xl border border-bloom-100"
              aria-hidden
            >
              <div className="bg-bloom-100 px-3 py-2">
                <p className="text-[11px] font-semibold text-bloom-700">
                  Prévia
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 bg-surface px-3 py-2.5">
                <span className="rounded-full bg-bloom-600 px-3 py-1 text-xs font-semibold text-white">
                  Botão
                </span>
                <span className="rounded-full bg-bloom-100 px-3 py-1 text-xs font-medium text-bloom-700">
                  Chip
                </span>
                <span className="text-sm font-medium text-bloom-600">
                  Link ✿
                </span>
              </div>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
              <motion.button
                type="button"
                onClick={() => void restore()}
                className="min-h-11 rounded-xl px-4 py-2.5 text-sm font-medium text-muted hover:bg-bloom-50 sm:min-h-0"
                {...press}
              >
                Restaurar padrão
              </motion.button>
              <motion.button
                type="button"
                onClick={onClose}
                className="min-h-11 rounded-xl bg-bloom-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-bloom-700 sm:min-h-0"
                {...press}
              >
                Pronto
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/** Alias legado */
export { ThemeCustomizer as ThemePersonalizeModal };
