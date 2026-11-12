/**
 * Flashcards + SRS (SM-2 simplificado, granularidade diária)
 * ----------------------------------------------------------
 * Persistência em localStorage até o SQLite Tauri ser ligado.
 * Campos alinhados ao schema: ease_factor, interval_days, repetitions, next_review_at.
 */

import type { Flashcard, FlashcardDeck, SubjectColor } from "../types";
import { listSubjects } from "./subjects";

export type SrsRating = "again" | "hard" | "good";

export type DeckView = FlashcardDeck & {
  color: SubjectColor;
  icon: string;
  dueCount: number;
};

export type ReviewStats = {
  dueToday: number;
  streakDays: number;
  /** Cartões com intervalo ≥ MASTERED_INTERVAL_DAYS */
  mastered: number;
};

export type ActiveCardResult = {
  card: Flashcard;
  index: number;
  total: number;
  deckName: string;
  deckId: string;
};

type DeckRecord = {
  id: string;
  subjectId: string;
  name: string;
};

type PersistedStore = {
  decks: DeckRecord[];
  cards: Flashcard[];
  streakDays: number;
  lastStudyDate: string | null;
};

const STORAGE_KEY = "study-bloom-flashcards-v1";
/** Intervalo (dias) a partir do qual contamos como “dominado”. */
export const MASTERED_INTERVAL_DAYS = 21;
const MIN_EASE = 1.3;
const DEFAULT_EASE = 2.5;

const SEED_DECKS: DeckRecord[] = [
  { id: "deck-redes", subjectId: "redes", name: "Redes de Computadores" },
  { id: "deck-calc", subjectId: "calc-1", name: "Cálculo 1" },
  { id: "deck-algo", subjectId: "algoritmos", name: "Algoritmos" },
  { id: "deck-bd", subjectId: "bd", name: "Banco de Dados" },
];

function card(
  id: string,
  deckId: string,
  question: string,
  answer: string,
  nextReviewAt: string,
  easeFactor = DEFAULT_EASE,
  intervalDays = 0,
  repetitions = 0,
): Flashcard {
  return {
    id,
    deckId,
    question,
    answer,
    nextReviewAt,
    easeFactor,
    intervalDays,
    repetitions,
  };
}

function todayIso(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDaysIso(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return todayIso(dt);
}

/** Seed relativo a hoje — due counts não mentem se a data do sistema mudar. */
function buildSeedCards(today = todayIso()): Flashcard[] {
  const tomorrow = addDaysIso(today, 1);
  return [
    card(
      "c1",
      "deck-redes",
      "O que diferencia TCP e UDP?",
      "TCP é orientado à conexão, confiável e ordenado; UDP é sem conexão, mais rápido e sem garantia de entrega.",
      today,
    ),
    card(
      "c2",
      "deck-redes",
      "O que é um endereço IP?",
      "Identificador lógico de um host em uma rede.",
      today,
    ),
    card(
      "c3",
      "deck-redes",
      "Para que serve o DNS?",
      "Traduz nomes de domínio em endereços IP.",
      tomorrow,
      2.6,
      3,
      2,
    ),
    card(
      "c4",
      "deck-redes",
      "O que é a camada de rede?",
      "Camada responsável pelo endereçamento lógico e pelo roteamento entre redes.",
      today,
      2.4,
      1,
      1,
    ),
    card(
      "c5",
      "deck-calc",
      "O que é uma integral indefinida?",
      "Família de primitivas F(x) cuja derivada é f(x), mais a constante C.",
      today,
    ),
    card(
      "c6",
      "deck-calc",
      "Qual a derivada de x²?",
      "2x",
      today,
      2.8,
      25,
      6,
    ),
    card(
      "c7",
      "deck-algo",
      "O que é uma lista encadeada?",
      "Estrutura onde cada nó guarda um valor e uma referência ao próximo nó.",
      today,
    ),
    card(
      "c8",
      "deck-bd",
      "Para que serve a chave primária?",
      "Identifica de forma única cada registro de uma tabela.",
      today,
      2.7,
      30,
      7,
    ),
  ];
}

function prevDayIso(isoDate: string): string {
  return addDaysIso(isoDate, -1);
}

function newId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function defaultStore(): PersistedStore {
  return {
    decks: SEED_DECKS.map((d) => ({ ...d })),
    cards: buildSeedCards(),
    streakDays: 0,
    lastStudyDate: null,
  };
}

function loadStore(): PersistedStore {
  if (typeof localStorage === "undefined") return defaultStore();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const fresh = defaultStore();
      saveStore(fresh);
      return fresh;
    }
    const parsed = JSON.parse(raw) as PersistedStore;
    if (!parsed?.decks || !parsed?.cards) {
      const fresh = defaultStore();
      saveStore(fresh);
      return fresh;
    }
    return {
      decks: parsed.decks,
      cards: parsed.cards.map((c) => ({
        ...c,
        easeFactor: c.easeFactor ?? DEFAULT_EASE,
        intervalDays: c.intervalDays ?? 0,
        repetitions: c.repetitions ?? 0,
        nextReviewAt: c.nextReviewAt ?? todayIso(),
      })),
      streakDays: parsed.streakDays ?? 0,
      lastStudyDate: parsed.lastStudyDate ?? null,
    };
  } catch {
    const fresh = defaultStore();
    saveStore(fresh);
    return fresh;
  }
}

function saveStore(store: PersistedStore): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function isDue(card: Flashcard, today = todayIso()): boolean {
  return card.nextReviewAt <= today;
}

/**
 * SM-2 diário com 3 botões:
 * - again: zera reps, interval 0 (continua due hoje), ease −0.2
 * - hard: sobe intervalo com ×1.2 (mín. 1), ease −0.15
 * - good: 1 → 3 → interval×ease; ease inalterado
 */
export function applySrs(
  card: Flashcard,
  rating: SrsRating,
  today = todayIso(),
): Flashcard {
  let easeFactor = card.easeFactor;
  let intervalDays = card.intervalDays;
  let repetitions = card.repetitions;

  if (rating === "again") {
    repetitions = 0;
    intervalDays = 0;
    easeFactor = Math.max(MIN_EASE, easeFactor - 0.2);
  } else if (rating === "hard") {
    if (repetitions === 0) {
      intervalDays = 1;
    } else {
      intervalDays = Math.max(1, Math.round(intervalDays * 1.2));
    }
    repetitions += 1;
    easeFactor = Math.max(MIN_EASE, easeFactor - 0.15);
  } else {
    if (repetitions === 0) {
      intervalDays = 1;
    } else if (repetitions === 1) {
      intervalDays = 3;
    } else {
      intervalDays = Math.max(1, Math.round(intervalDays * easeFactor));
    }
    repetitions += 1;
  }

  const nextReviewAt =
    rating === "again" ? today : addDaysIso(today, intervalDays);

  return {
    ...card,
    easeFactor: Math.round(easeFactor * 100) / 100,
    intervalDays,
    repetitions,
    nextReviewAt,
  };
}

function bumpStreak(store: PersistedStore, today = todayIso()): void {
  if (store.lastStudyDate === today) return;
  if (store.lastStudyDate === prevDayIso(today)) {
    store.streakDays += 1;
  } else {
    store.streakDays = 1;
  }
  store.lastStudyDate = today;
}

async function toDeckViews(store: PersistedStore): Promise<DeckView[]> {
  const subjects = await listSubjects();
  const byId = new Map(subjects.map((s) => [s.id, s]));
  const today = todayIso();

  return store.decks.map((deck) => {
    const subject = byId.get(deck.subjectId);
    const cards = store.cards.filter((c) => c.deckId === deck.id);
    return {
      id: deck.id,
      subjectId: deck.subjectId,
      name: deck.name,
      cardCount: cards.length,
      dueCount: cards.filter((c) => isDue(c, today)).length,
      color: subject?.color ?? "lavender",
      icon: subject?.icon ?? "✦",
    };
  });
}

export async function listDecks(): Promise<DeckView[]> {
  return toDeckViews(loadStore());
}

export async function listCardsForDeck(deckId: string): Promise<Flashcard[]> {
  return loadStore().cards.filter((c) => c.deckId === deckId);
}

/** Fila due (nextReviewAt ≤ hoje), estável por id. */
export async function listDueCards(deckId?: string): Promise<Flashcard[]> {
  const store = loadStore();
  const today = todayIso();
  return store.cards
    .filter((c) => (deckId ? c.deckId === deckId : true) && isDue(c, today))
    .sort((a, b) => a.id.localeCompare(b.id));
}

export async function getActiveCard(
  deckId?: string,
  cardIndex = 0,
): Promise<ActiveCardResult | null> {
  const store = loadStore();
  const today = todayIso();

  let targetDeckId = deckId;
  if (!targetDeckId) {
    const withDue = store.decks.find((d) =>
      store.cards.some((c) => c.deckId === d.id && isDue(c, today)),
    );
    targetDeckId = withDue?.id ?? store.decks[0]?.id;
  }
  if (!targetDeckId) return null;

  const deck = store.decks.find((d) => d.id === targetDeckId);
  if (!deck) return null;

  const due = store.cards
    .filter((c) => c.deckId === targetDeckId && isDue(c, today))
    .sort((a, b) => a.id.localeCompare(b.id));

  if (due.length === 0) {
    return {
      card: {
        id: "",
        deckId: targetDeckId,
        question: "",
        answer: "",
        nextReviewAt: today,
        easeFactor: DEFAULT_EASE,
        intervalDays: 0,
        repetitions: 0,
      },
      index: 0,
      total: 0,
      deckName: deck.name,
      deckId: deck.id,
    };
  }

  const safeIndex =
    ((cardIndex % due.length) + due.length) % due.length;
  const current = due[safeIndex];

  return {
    card: current,
    index: safeIndex + 1,
    total: due.length,
    deckName: deck.name,
    deckId: deck.id,
  };
}

export async function rateCard(
  cardId: string,
  rating: SrsRating,
): Promise<Flashcard> {
  const store = loadStore();
  const idx = store.cards.findIndex((c) => c.id === cardId);
  if (idx < 0) throw new Error("Cartão não encontrado.");

  const updated = applySrs(store.cards[idx], rating);
  store.cards[idx] = updated;
  bumpStreak(store);
  saveStore(store);
  return updated;
}

export async function createDeck(input: {
  name: string;
  subjectId: string;
}): Promise<DeckView> {
  const name = input.name.trim();
  if (!name) throw new Error("Informe o nome do baralho.");
  if (!input.subjectId) throw new Error("Escolha uma disciplina.");

  const store = loadStore();
  const deck: DeckRecord = {
    id: newId("deck"),
    subjectId: input.subjectId,
    name,
  };
  store.decks.push(deck);
  saveStore(store);

  const views = await toDeckViews(store);
  const view = views.find((d) => d.id === deck.id);
  if (!view) throw new Error("Falha ao criar baralho.");
  return view;
}

export async function createCard(input: {
  deckId: string;
  question: string;
  answer: string;
}): Promise<Flashcard> {
  const question = input.question.trim();
  const answer = input.answer.trim();
  if (!input.deckId) throw new Error("Escolha um baralho.");
  if (!question) throw new Error("Informe a pergunta.");
  if (!answer) throw new Error("Informe a resposta.");

  const store = loadStore();
  if (!store.decks.some((d) => d.id === input.deckId)) {
    throw new Error("Baralho não encontrado.");
  }

  const flashcard: Flashcard = {
    id: newId("card"),
    deckId: input.deckId,
    question,
    answer,
    nextReviewAt: todayIso(),
    easeFactor: DEFAULT_EASE,
    intervalDays: 0,
    repetitions: 0,
  };
  store.cards.push(flashcard);
  saveStore(store);
  return flashcard;
}

export async function getReviewStats(): Promise<ReviewStats> {
  const store = loadStore();
  const today = todayIso();
  const dueToday = store.cards.filter((c) => isDue(c, today)).length;
  const mastered = store.cards.filter(
    (c) => c.intervalDays >= MASTERED_INTERVAL_DAYS,
  ).length;

  let streakDays = store.streakDays;
  if (
    store.lastStudyDate &&
    store.lastStudyDate !== today &&
    store.lastStudyDate !== prevDayIso(today)
  ) {
    streakDays = 0;
    // Persistir reset — senão localStorage mentiria um streak morto
    if (store.streakDays !== 0) {
      store.streakDays = 0;
      saveStore(store);
    }
  }

  return { dueToday, streakDays, mastered };
}
