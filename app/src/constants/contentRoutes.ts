/** Slug inicial de conteúdo por disciplina (deep link alinhado ao Figma) */
export const CONTENT_SLUG: Record<string, string> = {
  "calc-1": "integrais",
  redes: "camada-de-rede",
  algoritmos: "listas",
  bd: "sql",
  es: "git",
};

export function subjectContentPath(subjectId: string): string {
  const slug = CONTENT_SLUG[subjectId] ?? "intro";
  return `/disciplinas/${subjectId}/conteudo/${slug}`;
}
