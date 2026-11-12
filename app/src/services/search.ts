/**
 * Busca global — agrega subjects, tasks, flashcards e eventos.
 * Usa os services públicos (mock hoje; SQLite depois) sem falar com o DB.
 */

import { subjectContentPath } from "../constants/contentRoutes";
import { listCalendarEvents } from "./calendar";
import { listCardsForDeck, listDecks } from "./flashcards";
import { listSubjects } from "./subjects";
import { listTasks } from "./tasks";

export type SearchResultKind = "subject" | "task" | "flashcard" | "event";

export type SearchResult = {
  id: string;
  kind: SearchResultKind;
  title: string;
  subtitle: string;
  href: string;
};

const KIND_LABEL: Record<SearchResultKind, string> = {
  subject: "Disciplina",
  task: "Tarefa",
  flashcard: "Flashcard",
  event: "Evento",
};

export function searchKindLabel(kind: SearchResultKind): string {
  return KIND_LABEL[kind];
}

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function matches(haystack: string, needle: string): boolean {
  if (!needle) return true;
  return normalize(haystack).includes(needle);
}

/** Indexa tudo uma vez; filtrar no cliente é suficiente no volume atual. */
export async function buildSearchIndex(): Promise<SearchResult[]> {
  const [subjects, tasks, decks, events] = await Promise.all([
    listSubjects(),
    listTasks(),
    listDecks(),
    listCalendarEvents(),
  ]);

  const subjectName = new Map(subjects.map((s) => [s.id, s.name]));
  const results: SearchResult[] = [];

  for (const subject of subjects) {
    results.push({
      id: `subject:${subject.id}`,
      kind: "subject",
      title: subject.name,
      subtitle: subject.description || "Disciplina",
      href: subjectContentPath(subject.id),
    });
  }

  for (const task of tasks) {
    const subject = subjectName.get(task.subjectId) ?? "Tarefa";
    results.push({
      id: `task:${task.id}`,
      kind: "task",
      title: task.title,
      subtitle: `${subject} · ${task.tag}`,
      href: "/kanban",
    });
  }

  const cardBatches = await Promise.all(
    decks.map(async (deck) => {
      const cards = await listCardsForDeck(deck.id);
      return { deck, cards };
    }),
  );

  for (const { deck, cards } of cardBatches) {
    results.push({
      id: `deck:${deck.id}`,
      kind: "flashcard",
      title: deck.name,
      subtitle: `Baralho · ${deck.cardCount} cards`,
      href: `/revisao?deck=${encodeURIComponent(deck.id)}`,
    });

    for (const card of cards) {
      results.push({
        id: `flashcard:${card.id}`,
        kind: "flashcard",
        title: card.question,
        subtitle: deck.name,
        href: `/revisao?deck=${encodeURIComponent(deck.id)}`,
      });
    }
  }

  for (const event of events) {
    results.push({
      id: `event:${event.id}`,
      kind: "event",
      title: event.title,
      subtitle: `${event.date} · ${event.type}`,
      href: "/calendario",
    });
  }

  return results;
}

export async function searchAll(query: string): Promise<SearchResult[]> {
  const needle = normalize(query);
  const index = await buildSearchIndex();
  if (!needle) return index.slice(0, 12);

  return index
    .filter(
      (item) =>
        matches(item.title, needle) ||
        matches(item.subtitle, needle) ||
        matches(KIND_LABEL[item.kind], needle),
    )
    .slice(0, 40);
}
