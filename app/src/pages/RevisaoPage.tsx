import { useCallback, useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { DeckList } from "../components/revisao/DeckList";
import {
  FlashcardActive,
  type SrsRating,
} from "../components/revisao/FlashcardActive";
import { SimpleModal } from "../components/ui/SimpleModal";
import { StatCard } from "../components/ui/StatCard";
import {
  getActiveCard,
  getReviewStats,
  listCardsForDeck,
  listDecks,
  type DeckView,
  type ReviewStats,
} from "../services/flashcards";

type Active = {
  question: string;
  answer: string;
  index: number;
  total: number;
  deckName: string;
  deckId: string;
  cardIndex: number;
};

export function RevisaoPage() {
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [decks, setDecks] = useState<DeckView[]>([]);
  const [active, setActive] = useState<Active | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const loadCard = useCallback(async (deckId: string, cardIndex: number) => {
    const data = await getActiveCard(deckId, cardIndex);
    setActive({
      question: data.card.question,
      answer: data.card.answer,
      index: data.index,
      total: data.total,
      deckName: data.deckName,
      deckId: data.deckId,
      cardIndex: data.index - 1,
    });
  }, []);

  useEffect(() => {
    void getReviewStats().then(setStats);
    void listDecks().then(setDecks);
    void loadCard("deck-redes", 2);
  }, [loadCard]);

  const handleRate = async (_rating: SrsRating) => {
    if (!active) return;
    const cards = await listCardsForDeck(active.deckId);
    if (cards.length === 0) return;
    const nextIndex = (active.cardIndex + 1) % cards.length;
    await loadCard(active.deckId, nextIndex);

    if (_rating === "good") {
      setStats((prev) =>
        prev
          ? {
              ...prev,
              dueToday: Math.max(0, prev.dueToday - 1),
              mastered: prev.mastered + 1,
            }
          : prev,
      );
    }
  };

  const handleSelectDeck = (deckId: string) => {
    void loadCard(deckId, 0);
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Para revisar hoje"
          value={String(stats?.dueToday ?? 8).padStart(2, "0")}
          icon={<Sparkles className="h-5 w-5" />}
          iconWrapClassName="bg-pastel-lavender text-bloom-600"
        />
        <StatCard
          label="Sequência de estudos"
          value={`${String(stats?.streakDays ?? 5).padStart(2, "0")} dias`}
          icon={<Sparkles className="h-5 w-5" />}
          iconWrapClassName="bg-pastel-pink text-[#db2777]"
        />
        <StatCard
          label="Cartões dominados"
          value={String(stats?.mastered ?? 42)}
          icon={<Sparkles className="h-5 w-5" />}
          iconWrapClassName="bg-pastel-mint text-emerald-700"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(260px,1fr)]">
        {active ? (
          <FlashcardActive
            key={`${active.deckId}-${active.index}`}
            deckName={active.deckName}
            index={active.index}
            total={active.total}
            question={active.question}
            answer={active.answer}
            onRate={handleRate}
          />
        ) : (
          <p className="text-sm text-muted">Carregando cartão…</p>
        )}
        <DeckList
          decks={decks}
          onCreate={() => setModalOpen(true)}
          onSelectDeck={handleSelectDeck}
          activeDeckId={active?.deckId}
        />
      </div>

      <p className="text-xs text-muted">
        ✦ Revisão espaçada baseada no resultado de cada cartão; intervalos
        configuráveis por matéria.
      </p>

      <SimpleModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Criar flashcard"
        description="Placeholder do fluxo de criação — em breve com SRS completo."
      >
        <div className="space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink">Pergunta</span>
            <input
              type="text"
              placeholder="Ex.: O que diferencia TCP e UDP?"
              className="w-full rounded-xl border border-bloom-200 bg-bloom-50/50 px-3 py-2.5 text-sm outline-none focus:border-bloom-400"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink">Resposta</span>
            <textarea
              rows={3}
              placeholder="Escreva a resposta…"
              className="w-full resize-none rounded-xl border border-bloom-200 bg-bloom-50/50 px-3 py-2.5 text-sm outline-none focus:border-bloom-400"
            />
          </label>
        </div>
      </SimpleModal>
    </div>
  );
}
