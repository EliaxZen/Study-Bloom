import { useEffect, useId, useRef } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { BookOpen, FileText, Heart, X } from "lucide-react";
import {
  modalBackdropVariants,
  modalPanelVariants,
  modalPanelVariantsReduced,
  pressable,
  pressableReduced,
  useReducedMotionPreference,
} from "../../lib/motion";
import { PASTEL_BG } from "../../lib/colors";
import { cn } from "../../lib/utils";
import { useFavoritesStore } from "../../stores/favoritesStore";

type FavoritesPanelProps = {
  open: boolean;
  onClose: () => void;
};

/** Lista favoritos e navega para matéria / conteúdo */
export function FavoritesPanel({ open, onClose }: FavoritesPanelProps) {
  const reduced = useReducedMotionPreference();
  const press = reduced ? pressableReduced : pressable;
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const items = useFavoritesStore((s) => s.items);
  const remove = useFavoritesStore((s) => s.remove);

  useEffect(() => {
    if (!open) return;
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
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="favorites-panel"
          className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-start sm:justify-end sm:p-4 sm:pt-16"
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
            className="relative z-10 flex max-h-[min(88dvh,32rem)] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-bloom-100 bg-surface shadow-xl outline-none sm:rounded-2xl"
            variants={
              reduced ? modalPanelVariantsReduced : modalPanelVariants
            }
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <div className="flex items-start justify-between gap-3 border-b border-bloom-100 px-4 py-4 sm:px-5">
              <div className="min-w-0">
                <h2
                  id={titleId}
                  className="flex items-center gap-2 text-lg font-bold text-ink"
                >
                  <Heart className="h-4 w-4 fill-current text-bloom-600" />
                  Favoritos
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Matérias e conteúdos guardados
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

            <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
              {items.length === 0 ? (
                <div className="rounded-2xl bg-bloom-50/80 px-4 py-8 text-center">
                  <p className="text-sm font-medium text-ink">
                    Nenhum favorito ainda
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Use o coração nas matérias ou conteúdos para guardar.
                  </p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {items.map((item) => {
                    const KindIcon =
                      item.kind === "subject" ? BookOpen : FileText;
                    return (
                      <li key={item.id}>
                        <div className="flex items-center gap-2 rounded-xl border border-bloom-100/80 bg-canvas/60 p-1.5 pr-2">
                          <Link
                            to={item.path}
                            onClick={onClose}
                            className="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-2 py-2 hover:bg-bloom-50"
                          >
                            <span
                              className={cn(
                                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base font-semibold text-ink/80",
                                item.color
                                  ? PASTEL_BG[item.color]
                                  : "bg-bloom-100",
                              )}
                            >
                              {item.icon ?? (
                                <KindIcon className="h-4 w-4 text-bloom-600" />
                              )}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold text-ink">
                                {item.title}
                              </span>
                              <span className="mt-0.5 block truncate text-xs text-muted">
                                {item.subtitle ??
                                  (item.kind === "subject"
                                    ? "Matéria"
                                    : "Conteúdo")}
                              </span>
                            </span>
                          </Link>
                          <motion.button
                            type="button"
                            aria-label={`Remover ${item.title}`}
                            onClick={() => remove(item.id)}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted hover:bg-pastel-pink hover:text-bloom-600"
                            {...press}
                          >
                            <Heart className="h-4 w-4 fill-current" />
                          </motion.button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
