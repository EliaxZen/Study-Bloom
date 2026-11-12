import type { Flashcard, FlashcardDeck, SubjectColor } from "../types";

export type DeckView = FlashcardDeck & {
  color: SubjectColor;
  icon: string;
};

const MOCK_DECKS: DeckView[] = [
  {
    id: "deck-redes",
    subjectId: "redes",
    name: "Redes de Computadores",
    cardCount: 12,
    color: "mint",
    icon: "⌘",
  },
  {
    id: "deck-calc",
    subjectId: "calc-1",
    name: "Cálculo 1",
    cardCount: 28,
    color: "pink",
    icon: "∫",
  },
  {
    id: "deck-algo",
    subjectId: "algoritmos",
    name: "Algoritmos",
    cardCount: 18,
    color: "lavender",
    icon: "</>",
  },
  {
    id: "deck-bd",
    subjectId: "bd",
    name: "Banco de Dados",
    cardCount: 14,
    color: "yellow",
    icon: "▦",
  },
];

const MOCK_CARDS: Flashcard[] = [
  {
    id: "c1",
    deckId: "deck-redes",
    question: "O que diferencia TCP e UDP?",
    answer:
      "TCP é orientado à conexão, confiável e ordenado; UDP é sem conexão, mais rápido e sem garantia de entrega.",
    nextReviewAt: "2026-11-11",
  },
  {
    id: "c2",
    deckId: "deck-redes",
    question: "O que é um endereço IP?",
    answer: "Identificador lógico de um host em uma rede.",
    nextReviewAt: "2026-11-11",
  },
  {
    id: "c3",
    deckId: "deck-redes",
    question: "Para que serve o DNS?",
    answer: "Traduz nomes de domínio em endereços IP.",
    nextReviewAt: "2026-11-12",
  },
  {
    id: "c4",
    deckId: "deck-redes",
    question: "O que é a camada de rede?",
    answer:
      "Camada responsável pelo endereçamento lógico e pelo roteamento entre redes.",
    nextReviewAt: "2026-11-11",
  },
  {
    id: "c5",
    deckId: "deck-calc",
    question: "O que é uma integral indefinida?",
    answer: "Família de primitivas F(x) cuja derivada é f(x), mais a constante C.",
    nextReviewAt: "2026-11-11",
  },
  {
    id: "c6",
    deckId: "deck-calc",
    question: "Qual a derivada de x²?",
    answer: "2x",
    nextReviewAt: "2026-11-11",
  },
  {
    id: "c7",
    deckId: "deck-algo",
    question: "O que é uma lista encadeada?",
    answer:
      "Estrutura onde cada nó guarda um valor e uma referência ao próximo nó.",
    nextReviewAt: "2026-11-11",
  },
  {
    id: "c8",
    deckId: "deck-bd",
    question: "Para que serve a chave primária?",
    answer: "Identifica de forma única cada registro de uma tabela.",
    nextReviewAt: "2026-11-11",
  },
];

export type ReviewStats = {
  dueToday: number;
  streakDays: number;
  mastered: number;
};

export type ActiveCardResult = {
  card: Flashcard;
  index: number;
  total: number;
  deckName: string;
  deckId: string;
};

export async function listDecks(): Promise<DeckView[]> {
  return MOCK_DECKS;
}

export async function listCardsForDeck(deckId: string): Promise<Flashcard[]> {
  return MOCK_CARDS.filter((c) => c.deckId === deckId);
}

/** Índice 0-based no baralho; display = index + 1 (Figma começa em Cartão 3). */
export async function getActiveCard(
  deckId = "deck-redes",
  cardIndex = 2,
): Promise<ActiveCardResult> {
  const deck = MOCK_DECKS.find((d) => d.id === deckId) ?? MOCK_DECKS[0];
  const cards = await listCardsForDeck(deck.id);
  const safeIndex =
    cards.length === 0 ? 0 : ((cardIndex % cards.length) + cards.length) % cards.length;
  const card = cards[safeIndex] ?? MOCK_CARDS[0];

  return {
    card,
    index: safeIndex + 1,
    /** Total visual do baralho (Figma: 12), não só os mocks carregados */
    total: deck.cardCount,
    deckName: deck.name,
    deckId: deck.id,
  };
}

export async function getReviewStats(): Promise<ReviewStats> {
  return { dueToday: 8, streakDays: 5, mastered: 42 };
}
