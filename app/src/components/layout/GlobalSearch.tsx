import {
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentType,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import {
  BookOpen,
  Brain,
  CalendarRange,
  KanbanSquare,
  Search,
  X,
} from "lucide-react";
import {
  modalBackdropVariants,
  modalPanelVariants,
  modalPanelVariantsReduced,
  pressable,
  pressableReduced,
  useReducedMotionPreference,
} from "../../lib/motion";
import { cn } from "../../lib/utils";
import { formControlClassName } from "../ui/formStyles";
import {
  searchAll,
  searchKindLabel,
  type SearchResult,
  type SearchResultKind,
} from "../../services/search";

type GlobalSearchProps = {
  open: boolean;
  onClose: () => void;
};

const KIND_ICON: Record<
  SearchResultKind,
  ComponentType<{ className?: string }>
> = {
  subject: BookOpen,
  task: KanbanSquare,
  flashcard: Brain,
  event: CalendarRange,
};

function isMacPlatform(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);
}

export function globalSearchShortcutLabel(): string {
  return isMacPlatform() ? "⌘K" : "Ctrl+K";
}

export function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const reduced = useReducedMotionPreference();
  const press = reduced ? pressableReduced : pressable;
  const navigate = useNavigate();
  const titleId = useId();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    setQuery("");
    setActiveIndex(0);
    setError(null);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => {
      document.body.style.overflow = prevOverflow;
      previouslyFocused.current?.focus?.();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    setLoading(true);
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const data = await searchAll(query);
          if (!alive) return;
          setResults(data);
          setActiveIndex(0);
          setError(null);
        } catch (e) {
          if (!alive) return;
          setResults([]);
          setError(e instanceof Error ? e.message : "Falha na busca");
        } finally {
          if (alive) setLoading(false);
        }
      })();
    }, query ? 120 : 0);

    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [open, query]);

  const selectResult = (item: SearchResult) => {
    onClose();
    navigate(item.href);
  };

  const onKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) =>
        results.length === 0 ? 0 : (i + 1) % results.length,
      );
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) =>
        results.length === 0
          ? 0
          : (i - 1 + results.length) % results.length,
      );
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const item = results[activeIndex];
      if (item) selectResult(item);
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="global-search"
          className="fixed inset-0 z-50 flex items-start justify-center px-3 pb-8 pt-[min(12vh,5rem)] sm:px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0.1 : 0.18 }}
          onKeyDown={onKeyDown}
        >
          <motion.button
            type="button"
            className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]"
            aria-label="Fechar busca"
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
            className="relative z-10 flex max-h-[min(80dvh,32rem)] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-bloom-100 bg-surface shadow-xl"
            variants={
              reduced ? modalPanelVariantsReduced : modalPanelVariants
            }
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <div className="flex items-center gap-2 border-b border-bloom-100 px-3 py-2.5 sm:px-4">
              <Search className="h-4 w-4 shrink-0 text-bloom-500" aria-hidden />
              <h2 id={titleId} className="sr-only">
                Busca global
              </h2>
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar disciplinas, tarefas, flashcards, eventos…"
                className={cn(
                  formControlClassName,
                  "border-0 bg-transparent px-0 py-2 shadow-none focus:border-0 focus:bg-transparent",
                )}
                aria-controls={listId}
                aria-autocomplete="list"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />
              <motion.button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-bloom-50 text-muted hover:bg-bloom-100 hover:text-ink"
                aria-label="Fechar"
                {...press}
              >
                <X className="h-4 w-4" />
              </motion.button>
            </div>

            <div
              id={listId}
              role="listbox"
              aria-label="Resultados da busca"
              className="min-h-0 flex-1 overflow-y-auto p-2"
            >
              {loading ? (
                <p className="px-3 py-6 text-center text-sm text-muted">
                  Buscando…
                </p>
              ) : error ? (
                <p className="px-3 py-6 text-center text-sm text-rose-600">
                  {error}
                </p>
              ) : results.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-muted">
                  Nada encontrado para “{query.trim()}”.
                </p>
              ) : (
                <ul className="space-y-0.5">
                  {results.map((item, index) => {
                    const Icon = KIND_ICON[item.kind];
                    const active = index === activeIndex;
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={active}
                          onMouseEnter={() => setActiveIndex(index)}
                          onClick={() => selectResult(item)}
                          className={cn(
                            "flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                            active
                              ? "bg-bloom-100 text-bloom-800"
                              : "text-ink hover:bg-bloom-50",
                          )}
                        >
                          <span
                            className={cn(
                              "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                              active
                                ? "bg-surface text-bloom-600"
                                : "bg-bloom-50 text-bloom-500",
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">
                              {item.title}
                            </span>
                            <span className="mt-0.5 block truncate text-xs text-muted">
                              {searchKindLabel(item.kind)} · {item.subtitle}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-bloom-100 px-3 py-2 text-[11px] text-muted sm:px-4">
              <span>↑↓ navegar · Enter abrir · Esc fechar</span>
              <span className="rounded-md bg-bloom-50 px-1.5 py-0.5 font-medium text-bloom-700">
                {globalSearchShortcutLabel()}
              </span>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
