import Editor from "@monaco-editor/react";
import { Copy, Play } from "lucide-react";

type CodeEditorPanelProps = {
  language: string;
  code: string;
  onChange: (value: string) => void;
};

export function CodeEditorPanel({
  language,
  code,
  onChange,
}: CodeEditorPanelProps) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      /* ignore */
    }
  };

  return (
    <section className="rounded-2xl border border-bloom-100 bg-surface p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-bold text-ink">Editor de código</h3>
        <span className="rounded-full bg-pastel-lavender px-3 py-1 text-xs font-semibold text-bloom-700">
          {language}
        </span>
      </div>

      <div className="h-[min(42vh,360px)] min-h-[220px] overflow-hidden rounded-xl border border-[#1e293b] bg-[#0f172a]">
        <Editor
          height="100%"
          language={language.toLowerCase()}
          value={code}
          onChange={(value) => onChange(value ?? "")}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            padding: { top: 12 },
            automaticLayout: true,
            wordWrap: "on",
          }}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 sm:gap-3">
        <button
          type="button"
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 sm:min-h-0 sm:flex-none"
        >
          <Play className="h-4 w-4" />
          Executar (futuro)
        </button>
        <button
          type="button"
          onClick={copy}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-pastel-lavender px-4 py-2.5 text-sm font-semibold text-bloom-700 hover:brightness-95 sm:min-h-0 sm:flex-none"
        >
          <Copy className="h-4 w-4" />
          Copiar código
        </button>
      </div>
      <p className="mt-3 text-xs text-muted">
        Blocos de código com linguagem, título e anexos.
      </p>
    </section>
  );
}
