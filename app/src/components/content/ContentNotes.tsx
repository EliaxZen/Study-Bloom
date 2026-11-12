import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

type ContentNotesProps = {
  title: string;
  tag: string;
  question: string;
  definition: string;
  formulaLatex: string;
  exampleLatex: string;
};

export function ContentNotes({
  title,
  tag,
  question,
  definition,
  formulaLatex,
  exampleLatex,
}: ContentNotesProps) {
  const markdown = `### ${question}

${definition}

$$
${formulaLatex}
$$

✦ Exemplo: $${exampleLatex}$
`;

  return (
    <section className="rounded-2xl border border-bloom-100 bg-surface p-6 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="text-xl font-bold text-ink">{title}</h3>
        <span className="rounded-full bg-pastel-lavender px-3 py-1 text-xs font-semibold text-bloom-700">
          {tag}
        </span>
      </div>

      <div className="prose-bloom mt-5 space-y-3 text-sm leading-relaxed text-ink">
        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
          {markdown}
        </ReactMarkdown>
      </div>

      <button
        type="button"
        className="mt-8 text-left text-sm font-medium text-bloom-600 hover:text-bloom-700 hover:underline"
      >
        + Adicionar bloco: texto · fórmula · checklist · arquivo
      </button>
    </section>
  );
}
