import { Plus } from "lucide-react";
import type { DeckView } from "../../services/flashcards";
import { PASTEL_BG } from "../../lib/colors";
import { cn } from "../../lib/utils";

type DeckListProps = {
  decks: DeckView[];
  onCreate?: () => void;
  onCreateDeck?: () => void;
  onSelectDeck?: (deckId: string) => void;
  activeDeckId?: string;
};

export function DeckList({
  decks,
  onCreate,
  onCreateDeck,
  onSelectDeck,
  activeDeckId,
}: DeckListProps) {
  return (
    <aside className="rounded-2xl border border-bloom-100 bg-surface p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-bold text-ink">Seus baralhos</h3>
        <div className="flex flex-wrap gap-2">
          {onCreateDeck ? (
            <button
              type="button"
              onClick={onCreateDeck}
              className="inline-flex items-center gap-1 rounded-xl border border-bloom-200 bg-surface px-3 py-2 text-xs font-semibold text-ink hover:bg-bloom-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bloom-500"
            >
              <Plus className="h-3.5 w-3.5" />
              Baralho
            </button>
          ) : null}
          {onCreate ? (
          <button
            type="button"
            onClick={() => onCreate?.()}
            className="inline-flex items-center gap-1 rounded-xl bg-bloom-600 px-3 py-2 text-xs font-semibold text-white hover:bg-bloom-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bloom-500"
          >
              <Plus className="h-3.5 w-3.5" />
              Cartão
            </button>
          ) : null}
        </div>
      </div>

      <ul className="space-y-2.5" aria-label="Baralhos">
        {decks.map((deck) => (
          <li key={deck.id}>
            <button
              type="button"
              aria-pressed={activeDeckId === deck.id}
              onClick={() => onSelectDeck?.(deck.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left transition hover:brightness-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bloom-500",
                PASTEL_BG[deck.color],
                activeDeckId === deck.id && "ring-2 ring-bloom-300",
              )}
            >
              <span className="text-lg font-bold text-ink/80">{deck.icon}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">
                  {deck.name}
                </p>
                <p className="text-xs text-ink/60">
                  {deck.cardCount} cartões
                  {deck.dueCount > 0
                    ? ` · ${deck.dueCount} due`
                    : " · em dia"}
                </p>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
