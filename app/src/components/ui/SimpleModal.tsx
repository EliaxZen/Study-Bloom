import { useEffect, useId, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import {
  modalBackdropVariants,
  modalPanelVariants,
  modalPanelVariantsReduced,
  pressable,
  pressableReduced,
  useReducedMotionPreference,
} from "../../lib/motion";

type SimpleModalProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children?: React.ReactNode;
};

/** Modal placeholder alinhado ao tom pastel do Figma (fluxos de criação). */
export function SimpleModal({
  open,
  title,
  description,
  onClose,
  children,
}: SimpleModalProps) {
  const reduced = useReducedMotionPreference();
  const press = reduced ? pressableReduced : pressable;
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusables = panelRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    // Foco inicial no painel (acessível; inputs continuam tabuláveis)
    window.setTimeout(() => panelRef.current?.focus(), 0);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      previouslyFocused.current?.focus?.();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="bloom-modal"
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
            className="relative z-10 max-h-[min(92dvh,40rem)] w-full max-w-md overflow-y-auto rounded-t-2xl border border-bloom-100 bg-surface p-4 shadow-xl outline-none sm:rounded-2xl sm:p-5"
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
                  {title}
                </h2>
                {description ? (
                  <p className="mt-1 text-sm text-muted">{description}</p>
                ) : null}
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
            {children}
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <motion.button
                type="button"
                onClick={onClose}
                className="min-h-11 rounded-xl px-4 py-2.5 text-sm font-medium text-muted hover:bg-bloom-50 sm:min-h-0"
                {...press}
              >
                Cancelar
              </motion.button>
              <motion.button
                type="button"
                onClick={onClose}
                className="min-h-11 rounded-xl bg-bloom-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-bloom-700 sm:min-h-0"
                {...press}
              >
                Salvar (em breve)
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
