import { useId, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Sparkles } from "lucide-react";
import {
  modalBackdropVariants,
  modalPanelVariants,
  modalPanelVariantsReduced,
  pressable,
  pressableReduced,
  useReducedMotionPreference,
} from "../../lib/motion";

export type UpdateDialogProps = {
  open: boolean;
  version: string;
  notes?: string | null;
  downloading: boolean;
  progress: number | null;
  error?: string | null;
  onUpdate: () => void;
  onDismiss: () => void;
};

/** Diálogo de atualização — tom pastel Study Bloom, amigável. */
export function UpdateDialog({
  open,
  version,
  notes,
  downloading,
  progress,
  error,
  onUpdate,
  onDismiss,
}: UpdateDialogProps) {
  const reduced = useReducedMotionPreference();
  const press = reduced ? pressableReduced : pressable;
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || downloading) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    window.addEventListener("keydown", onKey);
    window.setTimeout(() => panelRef.current?.focus(), 0);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, downloading, onDismiss]);

  const pct =
    progress != null && Number.isFinite(progress)
      ? Math.max(0, Math.min(100, Math.round(progress * 100)))
      : null;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="bloom-update"
          className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0.1 : 0.18 }}
        >
          <motion.button
            type="button"
            className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]"
            aria-label="Fechar"
            disabled={downloading}
            onClick={downloading ? undefined : onDismiss}
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
            className="relative z-10 w-full max-w-md overflow-hidden rounded-t-2xl border border-bloom-100 bg-surface shadow-xl outline-none sm:rounded-2xl"
            variants={
              reduced ? modalPanelVariantsReduced : modalPanelVariants
            }
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <div className="bg-gradient-to-br from-pastel-lavender via-bloom-50 to-pastel-pink px-5 pb-4 pt-5">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80 text-bloom-600 shadow-sm">
                <Sparkles className="h-5 w-5" aria-hidden />
              </div>
              <h2 id={titleId} className="text-lg font-bold text-ink">
                Tem uma versão nova do Study Bloom
              </h2>
              <p className="mt-1 text-sm text-muted">
                Versão {version} pronta pra instalar. Suas anotações e tarefas
                ficam guardadas.
              </p>
            </div>

            <div className="space-y-4 px-5 py-4">
              {notes ? (
                <div className="max-h-36 overflow-y-auto rounded-xl bg-canvas px-3 py-2.5 text-sm text-ink whitespace-pre-wrap">
                  {notes}
                </div>
              ) : (
                <p className="text-sm text-muted">
                  Melhorias e correções pra deixar o estudo mais leve.
                </p>
              )}

              {downloading ? (
                <div className="space-y-2" aria-live="polite">
                  <p className="text-sm font-medium text-ink">
                    Baixando atualização…
                  </p>
                  <div className="h-2 overflow-hidden rounded-full bg-bloom-100">
                    <div
                      className="h-full rounded-full bg-bloom-600 transition-[width] duration-200"
                      style={{
                        width: pct != null ? `${pct}%` : "35%",
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted">
                    {pct != null
                      ? `${pct}% — quase lá`
                      : "Preparando o download…"}
                  </p>
                </div>
              ) : null}

              {error ? (
                <p className="rounded-xl bg-pastel-pink/80 px-3 py-2 text-sm text-ink">
                  {error}
                </p>
              ) : null}

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <motion.button
                  type="button"
                  onClick={onDismiss}
                  disabled={downloading}
                  className="min-h-11 rounded-xl px-4 py-2.5 text-sm font-medium text-muted hover:bg-bloom-50 disabled:opacity-50 sm:min-h-0"
                  {...press}
                >
                  Agora não
                </motion.button>
                <motion.button
                  type="button"
                  onClick={onUpdate}
                  disabled={downloading}
                  className="min-h-11 rounded-xl bg-bloom-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-bloom-700 disabled:opacity-60 sm:min-h-0"
                  {...press}
                >
                  {downloading ? "Atualizando…" : "Atualizar agora"}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
