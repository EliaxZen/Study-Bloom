/**
 * Conteúdo por disciplina (tópicos + blocos)
 * ------------------------------------------
 * Persistência local (localStorage) alinhada ao schema
 * content_topics / content_blocks. Anexos: hooks para o agente de anexos.
 */

import type { SubjectColor } from "../types";
import { getSubjectById } from "./subjects";

export type ContentAttachment = {
  id: string;
  name: string;
  kind: "pdf" | "markdown" | "slide" | "link";
  meta: string;
  /** Caminho relativo a AppData quando o arquivo foi copiado pelo agente de anexos */
  path?: string | null;
};

export type ContentBlockKind = "text" | "formula" | "checklist" | "file";

export type ChecklistItem = {
  id: string;
  text: string;
  done: boolean;
};

export type ContentBlock = {
  id: string;
  kind: ContentBlockKind;
  body: string;
  sortOrder: number;
};

export type ContentTopicRecord = {
  id: string;
  subjectId: string;
  slug: string;
  title: string;
  tag: string;
  sortOrder: number;
  blocks: ContentBlock[];
};

export type ContentPageData = {
  subjectId: string;
  subjectName: string;
  subjectIcon: string;
  subjectColor: SubjectColor;
  slug: string;
  /** Chave estável subjectId:slug — painel de anexos e deep link */
  topicKey: string;
  breadcrumb: string;
  topicId: string;
  title: string;
  tag: string;
  blocks: ContentBlock[];
  /** Preenchido via hook — mutações ficam com o agente de anexos */
  attachments: ContentAttachment[];
};

const STORAGE_TOPICS = "study-bloom-content-topics";
/** Hook anexos: chave compartilhada — o agente de anexos lê/grava aqui. */
export const STORAGE_ATTACHMENTS = "study-bloom-content-attachments";

const BREADCRUMB_BY_SLUG: Record<string, string> = {
  integrais: "Integrais",
  "camada-de-rede": "Camada de rede",
  listas: "Listas",
  sql: "SQL",
  git: "Git",
  intro: "Introdução",
};

const SEED_ATTACHMENTS: Record<string, ContentAttachment[]> = {
  "calc-1:integrais": [
    { id: "a1", name: "Roteiro semana 11.pdf", kind: "pdf", meta: "PDF · 2,4 MB" },
    { id: "a2", name: "Lista de exercícios.pdf", kind: "pdf", meta: "PDF · 1,2 MB" },
    { id: "a3", name: "Anotações da aula.md", kind: "markdown", meta: "Markdown · 18 KB" },
    { id: "a4", name: "Prova anterior.pdf", kind: "pdf", meta: "PDF · 3,1 MB" },
  ],
  "redes:camada-de-rede": [
    { id: "r1", name: "Slides camada de rede.pdf", kind: "slide", meta: "PDF · 4,1 MB" },
    { id: "r2", name: "RFC 791 (IPv4).pdf", kind: "pdf", meta: "PDF · 1,8 MB" },
    { id: "r3", name: "Mapa mental redes.md", kind: "markdown", meta: "Markdown · 12 KB" },
  ],
  "algoritmos:listas": [
    { id: "al1", name: "Lista de exercícios.py", kind: "markdown", meta: "Python · 8 KB" },
    { id: "al2", name: "Notas de aula.md", kind: "markdown", meta: "Markdown · 22 KB" },
  ],
  "bd:sql": [
    { id: "b1", name: "Cheat sheet SQL.pdf", kind: "pdf", meta: "PDF · 900 KB" },
    { id: "b2", name: "Modelo ER.pdf", kind: "slide", meta: "PDF · 2,0 MB" },
  ],
  "es:git": [
    { id: "e1", name: "Guia Git básico.pdf", kind: "pdf", meta: "PDF · 1,1 MB" },
    { id: "e2", name: "Checklist de PR.md", kind: "markdown", meta: "Markdown · 6 KB" },
  ],
};

function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function seedTopics(): ContentTopicRecord[] {
  return [
    {
      id: "topic_calc_integrais",
      subjectId: "calc-1",
      slug: "integrais",
      title: "Integrais indefinidas",
      tag: "✦ Conteúdo 01",
      sortOrder: 0,
      blocks: [
        {
          id: "blk_c1_q",
          kind: "text",
          body: "### O que é uma integral indefinida?\n\nÉ uma família de funções primitivas F(x), cuja derivada é f(x).",
          sortOrder: 0,
        },
        {
          id: "blk_c1_f",
          kind: "formula",
          body: "\\int f(x)\\, dx = F(x) + C",
          sortOrder: 1,
        },
        {
          id: "blk_c1_e",
          kind: "formula",
          body: "\\int 2x\\, dx = x^2 + C",
          sortOrder: 2,
        },
        {
          id: "blk_c1_cl",
          kind: "checklist",
          body: JSON.stringify([
            { id: "ci1", text: "Revisar primitivas básicas", done: false },
            { id: "ci2", text: "Resolver lista da semana", done: false },
          ] satisfies ChecklistItem[]),
          sortOrder: 3,
        },
      ],
    },
    {
      id: "topic_redes_camada",
      subjectId: "redes",
      slug: "camada-de-rede",
      title: "Camada de rede",
      tag: "✦ Conteúdo 02",
      sortOrder: 0,
      blocks: [
        {
          id: "blk_r1_q",
          kind: "text",
          body: "### Qual o papel da camada de rede?\n\nEndereçar hosts logicamente e encaminhar pacotes entre redes distintas.",
          sortOrder: 0,
        },
        {
          id: "blk_r1_f",
          kind: "formula",
          body: "\\text{IP} = \\text{rede} + \\text{host}",
          sortOrder: 1,
        },
        {
          id: "blk_r1_e",
          kind: "formula",
          body: "\\text{192.168.0.0/24}",
          sortOrder: 2,
        },
      ],
    },
    {
      id: "topic_algo_listas",
      subjectId: "algoritmos",
      slug: "listas",
      title: "Listas e estruturas",
      tag: "✦ Conteúdo 03",
      sortOrder: 0,
      blocks: [
        {
          id: "blk_a1_q",
          kind: "text",
          body: "### O que é uma lista encadeada?\n\nEstrutura dinâmica em que cada nó aponta para o próximo elemento.",
          sortOrder: 0,
        },
        {
          id: "blk_a1_f",
          kind: "formula",
          body: "\\text{nó} = (\\text{valor}, \\text{próximo})",
          sortOrder: 1,
        },
        {
          id: "blk_a1_e",
          kind: "formula",
          body: "\\text{head} \\rightarrow 1 \\rightarrow 2 \\rightarrow \\emptyset",
          sortOrder: 2,
        },
      ],
    },
    {
      id: "topic_bd_sql",
      subjectId: "bd",
      slug: "sql",
      title: "Consultas SQL",
      tag: "✦ Conteúdo 04",
      sortOrder: 0,
      blocks: [
        {
          id: "blk_b1_q",
          kind: "text",
          body: "### Para que serve o SELECT?\n\nRecupera dados de uma ou mais tabelas, com filtros e projeções.",
          sortOrder: 0,
        },
        {
          id: "blk_b1_f",
          kind: "formula",
          body: "\\text{SELECT colunas FROM tabela}",
          sortOrder: 1,
        },
        {
          id: "blk_b1_e",
          kind: "formula",
          body: "\\text{SELECT nome FROM alunos WHERE media > 7}",
          sortOrder: 2,
        },
      ],
    },
    {
      id: "topic_es_git",
      subjectId: "es",
      slug: "git",
      title: "Fluxo com Git",
      tag: "✦ Conteúdo 05",
      sortOrder: 0,
      blocks: [
        {
          id: "blk_e1_q",
          kind: "text",
          body: "### O que é um commit?\n\nRegistro imutável de um conjunto de mudanças no repositório.",
          sortOrder: 0,
        },
        {
          id: "blk_e1_f",
          kind: "formula",
          body: "\\text{working} \\to \\text{staging} \\to \\text{commit}",
          sortOrder: 1,
        },
        {
          id: "blk_e1_e",
          kind: "formula",
          body: "\\text{git commit -m \"mensagem\"}",
          sortOrder: 2,
        },
      ],
    },
  ];
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof localStorage === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

function loadTopics(): ContentTopicRecord[] {
  const stored = readJson<ContentTopicRecord[] | null>(STORAGE_TOPICS, null);
  if (stored && Array.isArray(stored) && stored.length > 0) return stored;
  const seeded = seedTopics();
  writeJson(STORAGE_TOPICS, seeded);
  return seeded;
}

function saveTopics(topics: ContentTopicRecord[]): void {
  writeJson(STORAGE_TOPICS, topics);
}

function slugToBreadcrumb(slug: string) {
  return (
    BREADCRUMB_BY_SLUG[slug] ??
    slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ")
  );
}

/** Normaliza kinds legados do seed SQLite (question/definition/example). */
function normalizeBlock(block: ContentBlock): ContentBlock {
  const map: Record<string, ContentBlockKind> = {
    text: "text",
    formula: "formula",
    checklist: "checklist",
    file: "file",
    question: "text",
    definition: "text",
    example: "formula",
  };
  return {
    ...block,
    id: block.id || newId("blk"),
    kind: map[block.kind] ?? "text",
    body: typeof block.body === "string" ? block.body : "",
    sortOrder: typeof block.sortOrder === "number" ? block.sortOrder : 0,
  };
}

function findTopicExact(
  topics: ContentTopicRecord[],
  subjectId: string,
  slug: string,
): ContentTopicRecord | undefined {
  return topics.find((t) => t.subjectId === subjectId && t.slug === slug);
}

/** Deep link: só o par subjectId+slug da URL — nunca “herdar” tópico de outra disciplina. */
function ensureTopic(
  topics: ContentTopicRecord[],
  subjectId: string,
  slug: string,
): { topics: ContentTopicRecord[]; topic: ContentTopicRecord } {
  const existing = findTopicExact(topics, subjectId, slug);
  if (existing) {
    return { topics, topic: existing };
  }

  const created: ContentTopicRecord = {
    id: newId("topic"),
    subjectId,
    slug,
    title: slugToBreadcrumb(slug),
    tag: "✦ Novo conteúdo",
    sortOrder: topics.filter((t) => t.subjectId === subjectId).length,
    blocks: [
      {
        id: newId("blk"),
        kind: "text",
        body: "Comece a escrever suas anotações aqui.",
        sortOrder: 0,
      },
    ],
  };
  const next = [...topics, created];
  saveTopics(next);
  return { topics: next, topic: created };
}

/** Hook anexos: leitura. O agente de anexos deve gravar em STORAGE_ATTACHMENTS. */
export async function listAttachmentsForTopic(
  topicKey: string,
): Promise<ContentAttachment[]> {
  const all = readJson<Record<string, ContentAttachment[]>>(
    STORAGE_ATTACHMENTS,
    {},
  );
  // `[]` é falsy — usar `in` para empty state persistir após remover todos.
  if (Object.prototype.hasOwnProperty.call(all, topicKey)) {
    return Array.isArray(all[topicKey]) ? all[topicKey] : [];
  }
  const seeded = SEED_ATTACHMENTS[topicKey] ?? [];
  // Materializa seed na 1ª leitura para deletes/empty sobreviverem a reload.
  all[topicKey] = seeded;
  writeJson(STORAGE_ATTACHMENTS, all);
  return seeded;
}

/**
 * Hook anexos: gravação.
 * Deixe o agente de anexos chamar isto (ou migrar para SQLite `attachments`).
 */
export async function saveAttachmentsForTopic(
  topicKey: string,
  attachments: ContentAttachment[],
): Promise<void> {
  const all = readJson<Record<string, ContentAttachment[]>>(
    STORAGE_ATTACHMENTS,
    {},
  );
  all[topicKey] = attachments;
  writeJson(STORAGE_ATTACHMENTS, all);
}

/** Cria anexo em memória/localStorage (optimistic) — upload real fica com o agente de anexos. */
export async function createContentAttachment(input: {
  name: string;
  topicKey?: string;
}): Promise<ContentAttachment> {
  const name = input.name.trim();
  if (!name) throw new Error("Informe o nome do arquivo.");

  const lower = name.toLowerCase();
  const kind: ContentAttachment["kind"] = lower.endsWith(".md")
    ? "markdown"
    : lower.includes("slide")
      ? "slide"
      : lower.startsWith("http")
        ? "link"
        : "pdf";
  const meta =
    kind === "markdown"
      ? "Markdown · novo"
      : kind === "link"
        ? "Link"
        : "PDF · novo";

  const attachment: ContentAttachment = {
    id: newId("att"),
    name,
    kind,
    meta,
  };

  if (input.topicKey) {
    const current = await listAttachmentsForTopic(input.topicKey);
    await saveAttachmentsForTopic(input.topicKey, [...current, attachment]);
  }

  return attachment;
}

export async function getContentPage(
  subjectId?: string,
  slug?: string,
): Promise<ContentPageData> {
  // Mantém o par da URL mesmo se a disciplina ainda não existir no store —
  // evita redirecionar silenciosamente para calc-1 e desalinhamento de anexos.
  const resolvedSubjectId = (subjectId ?? "").trim() || "calc-1";
  const resolvedSlug = (slug ?? "").trim() || "integrais";
  const subject = await getSubjectById(resolvedSubjectId);

  let topics = loadTopics();
  const ensured = ensureTopic(topics, resolvedSubjectId, resolvedSlug);
  topics = ensured.topics;
  const topic = ensured.topic;
  const topicKey = `${resolvedSubjectId}:${resolvedSlug}`;
  const attachments = await listAttachmentsForTopic(topicKey);

  return {
    subjectId: resolvedSubjectId,
    subjectName: subject?.name ?? "Disciplina",
    subjectIcon: subject?.icon ?? "✿",
    subjectColor: subject?.color ?? "pink",
    slug: resolvedSlug,
    topicKey,
    breadcrumb: slugToBreadcrumb(resolvedSlug),
    topicId: topic.id,
    title: topic.title,
    tag: topic.tag,
    blocks: [...topic.blocks]
      .map(normalizeBlock)
      .sort((a, b) => a.sortOrder - b.sortOrder),
    attachments,
  };
}

export async function updateTopicMeta(
  topicId: string,
  patch: Partial<Pick<ContentTopicRecord, "title" | "tag">>,
): Promise<ContentTopicRecord | null> {
  const topics = loadTopics();
  const idx = topics.findIndex((t) => t.id === topicId);
  if (idx < 0) return null;
  topics[idx] = { ...topics[idx], ...patch };
  saveTopics(topics);
  return topics[idx];
}

export async function saveTopicBlocks(
  topicId: string,
  blocks: ContentBlock[],
): Promise<ContentTopicRecord | null> {
  const topics = loadTopics();
  const idx = topics.findIndex((t) => t.id === topicId);
  if (idx < 0) return null;
  const normalized = blocks.map((b, i) => ({ ...b, sortOrder: i }));
  topics[idx] = { ...topics[idx], blocks: normalized };
  saveTopics(topics);
  return topics[idx];
}

export async function addContentBlock(
  topicId: string,
  kind: ContentBlockKind,
  body?: string,
): Promise<ContentBlock | null> {
  const topics = loadTopics();
  const idx = topics.findIndex((t) => t.id === topicId);
  if (idx < 0) return null;

  const defaultBody =
    kind === "checklist"
      ? JSON.stringify([
          { id: newId("ci"), text: "Novo item", done: false },
        ] satisfies ChecklistItem[])
      : kind === "formula"
        ? "E = mc^2"
        : kind === "file"
          ? "Referência a arquivo (anexos)"
          : "Novo bloco de texto";

  const block: ContentBlock = {
    id: newId("blk"),
    kind,
    body: body ?? defaultBody,
    sortOrder: topics[idx].blocks.length,
  };
  topics[idx] = {
    ...topics[idx],
    blocks: [...topics[idx].blocks, block],
  };
  saveTopics(topics);
  return block;
}

export async function updateContentBlock(
  topicId: string,
  blockId: string,
  patch: Partial<Pick<ContentBlock, "body" | "kind">>,
): Promise<ContentBlock | null> {
  const topics = loadTopics();
  const tIdx = topics.findIndex((t) => t.id === topicId);
  if (tIdx < 0) return null;
  const blocks = topics[tIdx].blocks.map((b) =>
    b.id === blockId ? { ...b, ...patch } : b,
  );
  topics[tIdx] = { ...topics[tIdx], blocks };
  saveTopics(topics);
  return blocks.find((b) => b.id === blockId) ?? null;
}

export async function removeContentBlock(
  topicId: string,
  blockId: string,
): Promise<boolean> {
  const topics = loadTopics();
  const tIdx = topics.findIndex((t) => t.id === topicId);
  if (tIdx < 0) return false;
  const blocks = topics[tIdx].blocks
    .filter((b) => b.id !== blockId)
    .map((b, i) => ({ ...b, sortOrder: i }));
  topics[tIdx] = { ...topics[tIdx], blocks };
  saveTopics(topics);
  return true;
}

export function parseChecklistBody(body: string): ChecklistItem[] {
  try {
    const parsed = JSON.parse(body) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is Record<string, unknown> =>
          !!item && typeof item === "object",
      )
      .map((item, index) => ({
        id:
          typeof item.id === "string" && item.id
            ? item.id
            : `ci_legacy_${index}`,
        text: typeof item.text === "string" ? item.text : "",
        done: Boolean(item.done),
      }));
  } catch {
    /* ignore */
  }
  return [];
}

export function serializeChecklist(items: ChecklistItem[]): string {
  return JSON.stringify(items);
}
