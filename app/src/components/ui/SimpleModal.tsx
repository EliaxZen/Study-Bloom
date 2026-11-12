import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Loader2, X } from "lucide-react";
import {
  modalBackdropVariants,
  modalPanelVariants,
  modalPanelVariantsReduced,
  pressable,
  pressableReduced,
  useReducedMotionPreference,
} from "../../lib/motion";

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export type SimpleModalProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  /** Campos / conteúdo do formulário */
  children?: React.ReactNode;
  /**
   * Callback de salvar. Pode ser async —
   * o modal cuida de loading e captura de erro.
   */
  onSave?: () => void | Promise<void>;
  /** Alias de onSave (compat FormModal / páginas legadas) */
  onSubmit?: () => void | Promise<void>;
  saveLabel?: string;
  /** Alias de saveLabel */
  submitLabel?: string;
  cancelLabel?: string;
  /** Desabilita o botão Salvar (ex.: validação local) */
  saveDisabled?: boolean;
  /** Alias de saveDisabled */
  submitDisabled?: boolean;
  /**
   * Validação síncrona antes do save.
   * Retorne string de erro ou `null` se ok.
   */
  validate?: () => string | null | undefined;
  /** Loading controlado (opcional). Sem prop, o modal gerencia o async. */
  saving?: boolean;
  /** Alias de saving */
  submitting?: boolean;
  /** Erro controlado (opcional). Sem prop, captura exceções do save. */
  error?: string | null;
  /** Esconde Cancelar/Salvar (conteúdo customiza o rodapé). */
  hideFooter?: boolean;
  /** Alias de hideFooter */
  hideActions?: boolean;
};

/**
 * Modal base Study Bloom — form children, onSave, validação, loading,
 * Esc, focus trap e restore de foco.
 */
export function SimpleModal({
  open,
  title,
  description,
  onClose,
  children,
  onSave,
  onSubmit,
  saveLabel,
  submitLabel,
  cancelLabel = "Cancelar",
  saveDisabled,
  submitDisabled,
  validate,
  saving: savingProp,
  submitting: submittingProp,
  error: errorProp,
  hideFooter = false,
  hideActions = false,
}: SimpleModalProps) {
  const reduced = useReducedMotionPreference();
  const press = reduced ? pressableReduced : pressable;
  const titleId = useId();
  const errorId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);

  const saveHandler = onSave ?? onSubmit;
  const buttonLabel = saveLabel ?? submitLabel ?? "Salvar";
  const disabled = saveDisabled ?? submitDisabled ?? false;
  const isSaving = savingProp ?? submittingProp ?? busy;
  const displayError = errorProp !== undefined ? errorProp : internalError;
  const hideChrome = hideFooter || hideActions;
  const savingRef = useRef(isSaving);
  savingRef.current = isSaving;

  useEffect(() => {
    if (!open) {
      setBusy(false);
      setInternalError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (!savingRef.current) onClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusables = panelRef.current.querySelectorAll<HTMLElement>(
        FOCUSABLE_SELECTOR,
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
    window.setTimeout(() => {
      const firstField = panelRef.current?.querySelector<HTMLElement>(
        "input:not([disabled]), select:not([disabled]), textarea:not([disabled])",
      );
      (firstField ?? panelRef.current)?.focus();
    }, 0);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      previouslyFocused.current?.focus?.();
    };
  }, [open, onClose]);

  async function handleSave() {
    if (!saveHandler || isSaving || disabled) return;
    setInternalError(null);

    const validationError = validate?.() ?? null;
    if (validationError) {
      setInternalError(validationError);
      return;
    }

    setBusy(true);
    try {
      await saveHandler();
      onClose();
    } catch (e) {
      setInternalError(
        e instanceof Error ? e.message : "Não foi possível salvar.",
      );
    } finally {
      setBusy(false);
    }
  }

  function requestClose() {
    if (!isSaving) onClose();
  }

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
            disabled={isSaving}
            onClick={requestClose}
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
            aria-describedby={displayError ? errorId : undefined}
            aria-busy={isSaving || undefined}
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
                onClick={requestClose}
                disabled={isSaving}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-bloom-50 text-muted hover:bg-bloom-100 hover:text-ink disabled:opacity-50 sm:h-8 sm:w-8"
                aria-label="Fechar"
                {...press}
              >
                <X className="h-4 w-4" />
              </motion.button>
            </div>

            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                void handleSave();
              }}
            >
              {children}

              {displayError ? (
                <p
                  id={errorId}
                  role="alert"
                  className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
                >
                  {displayError}
                </p>
              ) : null}

              {!hideChrome ? (
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <motion.button
                    type="button"
                    onClick={requestClose}
                    disabled={isSaving}
                    className="min-h-11 rounded-xl px-4 py-2.5 text-sm font-medium text-muted hover:bg-bloom-50 disabled:opacity-50 sm:min-h-0"
                    {...press}
                  >
                    {cancelLabel}
                  </motion.button>
                  <motion.button
                    type="submit"
                    disabled={isSaving || disabled || !saveHandler}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-bloom-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-bloom-700 disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-0"
                    {...press}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        Salvando…
                      </>
                    ) : (
                      buttonLabel
                    )}
                  </motion.button>
                </div>
              ) : null}
            </form>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
