import { useEffect, useState } from "react";
import { Check, RotateCcw, X } from "lucide-react";

export type SrsRating = "again" | "hard" | "good";

type FlashcardActiveProps = {
  deckName: string;
  /** Id do cartão ativo — reseta o flip mesmo no Again (fila de 1) */
  cardId?: string;
  /** Posição 1-based na fila due; 0 se vazia */
  index: number;
  /** Total due na fila atual */
  total: number;
  question: string;
  answer: string;
  empty?: boolean;
  /** Bloqueia rate enquanto persiste SRS */
  busy?: boolean;
  onRate: (rating: SrsRating) => void;
};

export function FlashcardActive({
  deckName,
  cardId,
  index,
  total,
  question,
  answer,
  empty = false,
  busy = false,
  onRate,
}: FlashcardActiveProps) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    setRevealed(false);
  }, [cardId, question, index]);

  const rateDisabled = empty || !revealed || busy;

  const handleRate = (rating: SrsRating) => {
    if (rateDisabled) return;
    // Again com 1 cartão mantém o mesmo id/pergunta — sem isso o verso fica aberto
    setRevealed(false);
    onRate(rating);
  };

  return (
    <section className="rounded-2xl border border-bloom-100 bg-surface p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="min-w-0 truncate text-base font-bold text-ink">
          Flashcards / {deckName}
        </h3>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-pastel-lavender px-3 py-1 text-xs font-semibold text-bloom-700">
            {empty ? "Nada due" : `Restam ${total} na fila`}
          </span>
          <span className="rounded-full bg-pastel-mint px-3 py-1 text-xs font-semibold text-emerald-800">
            {empty ? "Fila limpa" : "Revisão de hoje"}
          </span>
        </div>
      </div>

      {empty ? (
        <div className="flex min-h-[180px] w-full flex-col items-center justify-center rounded-2xl bg-pastel-lavender/60 px-4 py-8 text-center sm:min-h-[220px]">
          <p className="text-lg font-bold text-ink sm:text-xl">
            Nenhum cartão para revisar
          </p>
          <p className="mt-3 max-w-sm text-sm text-muted">
            Tudo em dia neste baralho. Crie um cartão novo ou volte amanhã —
            a fila due usa nextReview real do SRS.
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setRevealed((v) => !v)}
          aria-pressed={revealed}
          disabled={busy}
          className="flex min-h-[180px] w-full flex-col items-center justify-center rounded-2xl bg-pastel-lavender px-4 py-8 text-center transition hover:brightness-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bloom-500 disabled:cursor-not-allowed disabled:opacity-70 sm:min-h-[220px] sm:px-6 sm:py-10"
        >
          <p className="text-lg font-bold break-words text-ink sm:text-xl md:text-2xl">
            {revealed ? answer : question}
          </p>
          <p className="mt-6 text-sm text-muted">
            {revealed
              ? "Clique para ver a pergunta"
              : "Clique para revelar a resposta"}
          </p>
        </button>
      )}

      {!empty && revealed ? (
        <>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <button
              type="button"
              disabled={rateDisabled}
              onClick={() => handleRate("again")}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-pastel-pink px-4 py-3 text-sm font-semibold text-ink hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bloom-500"
            >
              <X className="h-4 w-4" />
              Não lembrei
            </button>
            <button
              type="button"
              disabled={rateDisabled}
              onClick={() => handleRate("hard")}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-pastel-yellow px-4 py-3 text-sm font-semibold text-ink hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bloom-500"
            >
              <RotateCcw className="h-4 w-4" />
              Quase
            </button>
            <button
              type="button"
              disabled={rateDisabled}
              onClick={() => handleRate("good")}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-pastel-mint px-4 py-3 text-sm font-semibold text-ink hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bloom-500"
            >
              <Check className="h-4 w-4" />
              Acertei
            </button>
          </div>
          <p className="mt-4 text-center text-xs text-muted">
            Again / Hard / Good atualizam ease, intervalo, reps e nextReview
          </p>
        </>
      ) : (
        <p className="mt-5 text-center text-xs text-muted">
          {empty
            ? "Again / Hard / Good atualizam ease, intervalo, reps e nextReview"
            : "Revele a resposta para avaliar o cartão"}
        </p>
      )}
    </section>
  );
}
