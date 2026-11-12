import { useMemo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { Save } from "lucide-react";

type LatexPanelProps = {
  input: string;
  onInputChange: (value: string) => void;
  previewLatex: string;
  onSave?: () => void;
  saving?: boolean;
  dirty?: boolean;
};

export function LatexPanel({
  input,
  onInputChange,
  previewLatex,
  onSave,
  saving = false,
  dirty = false,
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
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-bold text-ink">Editor de LaTeX</h3>
        {dirty ? (
          <span className="rounded-full bg-pastel-pink px-2.5 py-0.5 text-[11px] font-semibold text-bloom-700">
            editado
          </span>
        ) : null}
      </div>

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

      {onSave ? (
        <button
          type="button"
          onClick={onSave}
          disabled={saving || !dirty}
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-bloom-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-bloom-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? "Salvando…" : "Salvar fórmula"}
        </button>
      ) : null}
    </section>
  );
}
