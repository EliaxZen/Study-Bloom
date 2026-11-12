import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { DeckList } from "../components/revisao/DeckList";
import {
  FlashcardActive,
  type SrsRating,
} from "../components/revisao/FlashcardActive";
import { FormField } from "../components/ui/FormField";
import { SimpleModal } from "../components/ui/SimpleModal";
import { formControlClassName } from "../components/ui/formStyles";
import { StatCard } from "../components/ui/StatCard";
import { useSubjects } from "../hooks/useSubjects";
import {
  MASTERED_INTERVAL_DAYS,
  createCard,
  createDeck,
  getReviewStats,
  listDecks,
  listDueCards,
  rateCard,
  type DeckView,
  type ReviewStats,
} from "../services/flashcards";
import type { Flashcard } from "../types";
import { useToastStore } from "../stores/toastStore";

type Session = {
  deckId: string;
  deckName: string;
  queue: Flashcard[];
};

type ModalMode = "card" | "deck";

export function RevisaoPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const deckFromSearch = searchParams.get("deck");
  const { subjects } = useSubjects();
  const showToast = useToastStore((s) => s.show);
  const ratingLock = useRef(false);

  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [decks, setDecks] = useState<DeckView[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [ratingBusy, setRatingBusy] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode | null>(null);

  const [cardQuestion, setCardQuestion] = useState("");
  const [cardAnswer, setCardAnswer] = useState("");
  const [cardDeckId, setCardDeckId] = useState("");

  const [deckName, setDeckName] = useState("");
  const [deckSubjectId, setDeckSubjectId] = useState("");

  const refreshMeta = useCallback(async () => {
    const [nextStats, nextDecks] = await Promise.all([
      getReviewStats(),
      listDecks(),
    ]);
    setStats(nextStats);
    setDecks(nextDecks);
    return nextDecks;
  }, []);

  const openDeckSession = useCallback(async (deckId: string) => {
    const due = await listDueCards(deckId);
    const allDecks = await listDecks();
    const deck = allDecks.find((d) => d.id === deckId);
    setSession({
      deckId,
      deckName: deck?.name ?? "Baralho",
      queue: due,
    });
  }, []);

  const selectDeck = useCallback(
    (deckId: string) => {
      setCardDeckId(deckId);
      setSearchParams(
        (prev) => {
          if (prev.get("deck") === deckId) return prev;
          const next = new URLSearchParams(prev);
          next.set("deck", deckId);
          return next;
        },
        { replace: true },
      );
      void openDeckSession(deckId);
    },
    [openDeckSession, setSearchParams],
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const nextDecks = await refreshMeta();
      if (cancelled) return;
      const fromSearch = deckFromSearch
        ? nextDecks.find((d) => d.id === deckFromSearch)
        : undefined;
      const target =
        fromSearch ??
        nextDecks.find((d) => d.dueCount > 0) ??
        nextDecks[0];
      if (!target) return;

      const due = await listDueCards(target.id);
      if (cancelled) return;
      setSession({
        deckId: target.id,
        deckName: target.name,
        queue: due,
      });
      setCardDeckId(target.id);

      if (!deckFromSearch) {
        setSearchParams(
          (prev) => {
            if (prev.get("deck") === target.id) return prev;
            const next = new URLSearchParams(prev);
            next.set("deck", target.id);
            return next;
          },
          { replace: true },
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshMeta, deckFromSearch, setSearchParams]);

  useEffect(() => {
    if (!cardDeckId && decks[0]) setCardDeckId(decks[0].id);
  }, [decks, cardDeckId]);

  useEffect(() => {
    if (!deckSubjectId && subjects[0]) setDeckSubjectId(subjects[0].id);
  }, [subjects, deckSubjectId]);

  const current = session?.queue[0] ?? null;
  const queueLen = session?.queue.length ?? 0;

  const handleRate = async (rating: SrsRating) => {
    if (!session || !current || ratingLock.current) return;
    ratingLock.current = true;
    setRatingBusy(true);

    try {
      const updated = await rateCard(current.id, rating);
      await refreshMeta();

      setSession((prev) => {
        if (!prev) return prev;
        const rest = prev.queue.slice(1);
        // Again permanece due hoje → volta ao fim da fila
        if (rating === "again" || updated.nextReviewAt <= todayLocal()) {
          return { ...prev, queue: [...rest, updated] };
        }
        return { ...prev, queue: rest };
      });
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : "Não foi possível registrar a revisão.",
      );
    } finally {
      ratingLock.current = false;
      setRatingBusy(false);
    }
  };

  const handleSelectDeck = (deckId: string) => {
    if (ratingBusy || session?.deckId === deckId) return;
    selectDeck(deckId);
  };

  const openCardModal = () => {
    setCardQuestion("");
    setCardAnswer("");
    setCardDeckId(session?.deckId || decks[0]?.id || "");
    setModalMode("card");
  };

  const openDeckModal = () => {
    setDeckName("");
    setDeckSubjectId(subjects[0]?.id ?? "");
    setModalMode("deck");
  };

  const handleCreateCard = async () => {
    const created = await createCard({
      deckId: cardDeckId,
      question: cardQuestion,
      answer: cardAnswer,
    });
    await refreshMeta();
    showToast("Cartão criado — já está na fila due.");
    if (session?.deckId === created.deckId) {
      setSession((prev) =>
        prev
          ? { ...prev, queue: [...prev.queue, created] }
          : prev,
      );
    } else if (created.deckId) {
      selectDeck(created.deckId);
    }
  };

  const handleCreateDeck = async () => {
    const created = await createDeck({
      name: deckName,
      subjectId: deckSubjectId,
    });
    await refreshMeta();
    selectDeck(created.id);
    showToast("Baralho criado.");
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Para revisar hoje"
          value={String(stats?.dueToday ?? 0).padStart(2, "0")}
          icon={<Sparkles className="h-5 w-5" />}
          iconWrapClassName="bg-pastel-lavender text-bloom-600"
        />
        <StatCard
          label="Sequência de estudos"
          value={`${String(stats?.streakDays ?? 0).padStart(2, "0")} dias`}
          icon={<Sparkles className="h-5 w-5" />}
          iconWrapClassName="bg-pastel-pink text-[#db2777]"
        />
        <StatCard
          label={`Dominados (≥${MASTERED_INTERVAL_DAYS}d)`}
          value={String(stats?.mastered ?? 0)}
          icon={<Sparkles className="h-5 w-5" />}
          iconWrapClassName="bg-pastel-mint text-emerald-700"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(260px,1fr)]">
        {session ? (
          <FlashcardActive
            key={current?.id ?? `${session.deckId}-empty`}
            deckName={session.deckName}
            cardId={current?.id}
            index={current ? 1 : 0}
            total={queueLen}
            question={current?.question ?? ""}
            answer={current?.answer ?? ""}
            empty={!current}
            busy={ratingBusy}
            onRate={handleRate}
          />
        ) : (
          <p className="text-sm text-muted">Carregando cartão…</p>
        )}
        <DeckList
          decks={decks}
          onCreate={openCardModal}
          onCreateDeck={openDeckModal}
          onSelectDeck={handleSelectDeck}
          activeDeckId={session?.deckId}
        />
      </div>

      <p className="text-xs text-muted">
        ✦ SRS real: ease / intervalo / reps / nextReview. Stats = due de hoje,
        streak de dias com review e cartões com intervalo ≥{" "}
        {MASTERED_INTERVAL_DAYS} dias.
      </p>

      <SimpleModal
        open={modalMode === "card"}
        onClose={() => setModalMode(null)}
        title="Criar flashcard"
        description="O cartão nasce due hoje (interval 0, ease 2.5)."
        saveLabel="Criar cartão"
        onSave={handleCreateCard}
        validate={() => {
          if (!cardDeckId) return "Selecione um baralho.";
          if (!cardQuestion.trim()) return "Informe a pergunta.";
          if (!cardAnswer.trim()) return "Informe a resposta.";
          return null;
        }}
      >
        <div className="space-y-3">
          <FormField label="Baralho">
            <select
              value={cardDeckId}
              onChange={(e) => setCardDeckId(e.target.value)}
              className={formControlClassName}
            >
              {decks.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Pergunta">
            <input
              type="text"
              value={cardQuestion}
              onChange={(e) => setCardQuestion(e.target.value)}
              placeholder="Ex.: O que diferencia TCP e UDP?"
              className={formControlClassName}
            />
          </FormField>
          <FormField label="Resposta">
            <textarea
              rows={3}
              value={cardAnswer}
              onChange={(e) => setCardAnswer(e.target.value)}
              placeholder="Escreva a resposta…"
              className={`${formControlClassName} resize-none`}
            />
          </FormField>
        </div>
      </SimpleModal>

      <SimpleModal
        open={modalMode === "deck"}
        onClose={() => setModalMode(null)}
        title="Criar baralho"
        description="Associe a uma disciplina para cor e ícone."
        saveLabel="Criar baralho"
        onSave={handleCreateDeck}
        validate={() => {
          if (!deckName.trim()) return "Informe o nome do baralho.";
          if (!deckSubjectId) return "Escolha uma disciplina.";
          return null;
        }}
      >
        <div className="space-y-3">
          <FormField label="Nome">
            <input
              type="text"
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
              placeholder="Ex.: Protocolos de transporte"
              className={formControlClassName}
            />
          </FormField>
          <FormField label="Disciplina">
            <select
              value={deckSubjectId}
              onChange={(e) => setDeckSubjectId(e.target.value)}
              className={formControlClassName}
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </FormField>
        </div>
      </SimpleModal>
    </div>
  );
}

function todayLocal(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
