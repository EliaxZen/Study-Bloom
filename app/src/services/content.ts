import type { SubjectColor } from "../types";
import { getSubjectById } from "./subjects";

export type ContentAttachment = {
  id: string;
  name: string;
  kind: "pdf" | "markdown" | "slide" | "link";
  meta: string;
};

export type ContentPageData = {
  subjectId: string;
  subjectName: string;
  subjectIcon: string;
  subjectColor: SubjectColor;
  slug: string;
  breadcrumb: string;
  title: string;
  tag: string;
  question: string;
  definition: string;
  formulaLatex: string;
  exampleLatex: string;
  attachments: ContentAttachment[];
};

type ContentBody = {
  title: string;
  tag: string;
  question: string;
  definition: string;
  formulaLatex: string;
  exampleLatex: string;
  attachments: ContentAttachment[];
};

const BREADCRUMB_BY_SLUG: Record<string, string> = {
  integrais: "Integrais",
  "camada-de-rede": "Camada de rede",
  listas: "Listas",
  sql: "SQL",
  git: "Git",
  intro: "Introdução",
};

const CONTENT_BY_KEY: Record<string, ContentBody> = {
  "calc-1:integrais": {
    title: "Integrais indefinidas",
    tag: "✦ Conteúdo 01",
    question: "O que é uma integral indefinida?",
    definition:
      "É uma família de funções primitivas F(x), cuja derivada é f(x).",
    formulaLatex: "\\int f(x)\\, dx = F(x) + C",
    exampleLatex: "\\int 2x\\, dx = x^2 + C",
    attachments: [
      {
        id: "a1",
        name: "Roteiro semana 11.pdf",
        kind: "pdf",
        meta: "PDF · 2,4 MB",
      },
      {
        id: "a2",
        name: "Lista de exercícios.pdf",
        kind: "pdf",
        meta: "PDF · 1,2 MB",
      },
      {
        id: "a3",
        name: "Anotações da aula.md",
        kind: "markdown",
        meta: "Markdown · 18 KB",
      },
      {
        id: "a4",
        name: "Prova anterior.pdf",
        kind: "pdf",
        meta: "PDF · 3,1 MB",
      },
    ],
  },
  "redes:camada-de-rede": {
    title: "Camada de rede",
    tag: "✦ Conteúdo 02",
    question: "Qual o papel da camada de rede?",
    definition:
      "Endereçar hosts logicamente e encaminhar pacotes entre redes distintas.",
    formulaLatex: "\\text{IP} = \\text{rede} + \\text{host}",
    exampleLatex: "\\text{192.168.0.0/24}",
    attachments: [
      {
        id: "r1",
        name: "Slides camada de rede.pdf",
        kind: "slide",
        meta: "PDF · 4,1 MB",
      },
      {
        id: "r2",
        name: "RFC 791 (IPv4).pdf",
        kind: "pdf",
        meta: "PDF · 1,8 MB",
      },
      {
        id: "r3",
        name: "Mapa mental redes.md",
        kind: "markdown",
        meta: "Markdown · 12 KB",
      },
    ],
  },
  "algoritmos:listas": {
    title: "Listas e estruturas",
    tag: "✦ Conteúdo 03",
    question: "O que é uma lista encadeada?",
    definition:
      "Estrutura dinâmica em que cada nó aponta para o próximo elemento.",
    formulaLatex: "\\text{nó} = (\\text{valor}, \\text{próximo})",
    exampleLatex: "\\text{head} \\rightarrow 1 \\rightarrow 2 \\rightarrow \\emptyset",
    attachments: [
      {
        id: "al1",
        name: "Lista de exercícios.py",
        kind: "markdown",
        meta: "Python · 8 KB",
      },
      {
        id: "al2",
        name: "Notas de aula.md",
        kind: "markdown",
        meta: "Markdown · 22 KB",
      },
    ],
  },
  "bd:sql": {
    title: "Consultas SQL",
    tag: "✦ Conteúdo 04",
    question: "Para que serve o SELECT?",
    definition:
      "Recupera dados de uma ou mais tabelas, com filtros e projeções.",
    formulaLatex: "\\text{SELECT colunas FROM tabela}",
    exampleLatex: "\\text{SELECT nome FROM alunos WHERE media > 7}",
    attachments: [
      {
        id: "b1",
        name: "Cheat sheet SQL.pdf",
        kind: "pdf",
        meta: "PDF · 900 KB",
      },
      {
        id: "b2",
        name: "Modelo ER.pdf",
        kind: "slide",
        meta: "PDF · 2,0 MB",
      },
    ],
  },
  "es:git": {
    title: "Fluxo com Git",
    tag: "✦ Conteúdo 05",
    question: "O que é um commit?",
    definition:
      "Registro imutável de um conjunto de mudanças no repositório.",
    formulaLatex: "\\text{working} \\to \\text{staging} \\to \\text{commit}",
    exampleLatex: "\\text{git commit -m \"mensagem\"}",
    attachments: [
      {
        id: "e1",
        name: "Guia Git básico.pdf",
        kind: "pdf",
        meta: "PDF · 1,1 MB",
      },
      {
        id: "e2",
        name: "Checklist de PR.md",
        kind: "markdown",
        meta: "Markdown · 6 KB",
      },
    ],
  },
};

const DEFAULT_BODY = CONTENT_BY_KEY["calc-1:integrais"];

function slugToBreadcrumb(slug: string) {
  return (
    BREADCRUMB_BY_SLUG[slug] ??
    slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ")
  );
}

function resolveBody(subjectId: string, slug: string): ContentBody {
  const key = `${subjectId}:${slug}`;
  if (CONTENT_BY_KEY[key]) return CONTENT_BY_KEY[key];

  const bySlug = Object.entries(CONTENT_BY_KEY).find(([k]) =>
    k.endsWith(`:${slug}`),
  );
  if (bySlug) return bySlug[1];

  const bySubject = Object.entries(CONTENT_BY_KEY).find(([k]) =>
    k.startsWith(`${subjectId}:`),
  );
  if (bySubject) return bySubject[1];

  return DEFAULT_BODY;
}

export async function getContentPage(
  subjectId?: string,
  slug?: string,
): Promise<ContentPageData> {
  const subject = subjectId ? await getSubjectById(subjectId) : undefined;
  const resolvedSubjectId = subject?.id ?? "calc-1";
  const resolvedSlug = slug || "integrais";
  const body = resolveBody(resolvedSubjectId, resolvedSlug);

  return {
    subjectId: resolvedSubjectId,
    subjectName: subject?.name ?? "Cálculo 1",
    subjectIcon: subject?.icon ?? "∫",
    subjectColor: subject?.color ?? "pink",
    slug: resolvedSlug,
    breadcrumb: slugToBreadcrumb(resolvedSlug),
    ...body,
  };
}
