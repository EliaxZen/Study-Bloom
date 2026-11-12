import { useMemo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

type LatexPanelProps = {
  input: string;
  onInputChange: (value: string) => void;
  previewLatex: string;
};

export function LatexPanel({
  input,
  onInputChange,
  previewLatex,
}: LatexPanelProps) {
  const previewHtml = useMemo(() => {
    try {
      return katex.renderToString(previewLatex, {
        throwOnError: false,
        displayMode: true,
      });
    } catch {
      return "";
    }
  }, [previewLatex]);

  return (
    <section className="rounded-2xl border border-bloom-100 bg-surface p-4 shadow-sm sm:p-5">
      <h3 className="mb-4 text-base font-bold text-ink">Editor de LaTeX</h3>

      <label className="block text-xs font-semibold text-muted">
        Expressão de entrada
        <textarea
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          rows={2}
          className="mt-1.5 w-full resize-none rounded-xl border border-bloom-200 bg-bloom-50/60 px-3 py-2 font-mono text-sm text-ink outline-none focus:border-bloom-400"
        />
      </label>

      <div className="mt-4">
        <p className="text-xs font-semibold text-muted">Prévia matemática</p>
        <div
          className="mt-1.5 flex min-h-[64px] items-center justify-center overflow-x-auto rounded-xl border border-bloom-100 bg-bloom-50/40 px-3 py-4"
          dangerouslySetInnerHTML={{ __html: previewHtml }}
        />
      </div>
    </section>
  );
}
