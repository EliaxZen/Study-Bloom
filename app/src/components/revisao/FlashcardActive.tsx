import { useEffect, useState } from "react";
import { Check, RotateCcw, X } from "lucide-react";

export type SrsRating = "again" | "hard" | "good";

type FlashcardActiveProps = {
  deckName: string;
  index: number;
  total: number;
  question: string;
  answer: string;
  onRate: (rating: SrsRating) => void;
};

export function FlashcardActive({
  deckName,
  index,
  total,
  question,
  answer,
  onRate,
}: FlashcardActiveProps) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    setRevealed(false);
  }, [question, index]);

  return (
    <section className="rounded-2xl border border-bloom-100 bg-surface p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="min-w-0 truncate text-base font-bold text-ink">
          Flashcards / {deckName}
        </h3>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-pastel-lavender px-3 py-1 text-xs font-semibold text-bloom-700">
            Cartão {index} de {total}
          </span>
          <span className="rounded-full bg-pastel-mint px-3 py-1 text-xs font-semibold text-emerald-800">
            Revisão de hoje
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setRevealed((v) => !v)}
        aria-pressed={revealed}
        className="flex min-h-[180px] w-full flex-col items-center justify-center rounded-2xl bg-pastel-lavender px-4 py-8 text-center transition hover:brightness-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bloom-500 sm:min-h-[220px] sm:px-6 sm:py-10"
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

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <button
          type="button"
          disabled={!revealed}
          onClick={() => onRate("again")}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-pastel-pink px-4 py-3 text-sm font-semibold text-ink hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bloom-500"
        >
          <X className="h-4 w-4" />
          Não lembrei
        </button>
        <button
          type="button"
          disabled={!revealed}
          onClick={() => onRate("hard")}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-pastel-yellow px-4 py-3 text-sm font-semibold text-ink hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bloom-500"
        >
          <RotateCcw className="h-4 w-4" />
          Quase
        </button>
        <button
          type="button"
          disabled={!revealed}
          onClick={() => onRate("good")}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-pastel-mint px-4 py-3 text-sm font-semibold text-ink hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bloom-500"
        >
          <Check className="h-4 w-4" />
          Acertei
        </button>
      </div>

      <p className="mt-4 text-center text-xs text-muted">
        Próxima revisão calculada conforme o desempenho
      </p>
    </section>
  );
}
