import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import { Copy, Play, Save } from "lucide-react";
import { ensureMonacoWorkers } from "../../lib/monacoSetup";
import {
  monacoLanguage,
  runJavaScriptSandbox,
  runUnsupportedMessage,
  type RunResult,
} from "../../services/laboratory";

ensureMonacoWorkers();

type CodeEditorPanelProps = {
  language: string;
  code: string;
  onChange: (value: string) => void;
  onSave?: () => void;
  saving?: boolean;
  dirty?: boolean;
};

export function CodeEditorPanel({
  language,
  code,
  onChange,
  onSave,
  saving = false,
  dirty = false,
}: CodeEditorPanelProps) {
  const [output, setOutput] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    setOutput(null);
  }, [language]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      /* ignore */
    }
  };

  const run = async () => {
    const lang = language.trim().toLowerCase();
    const isJs = lang === "javascript" || lang === "js";
    setRunning(true);
    setOutput(null);
    try {
      if (!isJs) {
        setOutput(runUnsupportedMessage(language));
        return;
      }
      const result = await runJavaScriptSandbox(code);
      setOutput(result);
    } catch (err) {
      setOutput({
        ok: false,
        stdout: "",
        stderr:
          err instanceof Error
            ? err.message
            : "Falha ao executar no sandbox.",
        limited: true,
      });
    } finally {
      setRunning(false);
    }
  };

  return (
    <section className="rounded-2xl border border-bloom-100 bg-surface p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-bold text-ink">Editor de código</h3>
        <span className="rounded-full bg-pastel-lavender px-3 py-1 text-xs font-semibold text-bloom-700">
          {language}
          {dirty ? " · editado" : ""}
        </span>
      </div>

      <div className="h-[min(42vh,360px)] min-h-[220px] overflow-hidden rounded-xl border border-[#1e293b] bg-[#0f172a]">
        <Editor
          height="100%"
          language={monacoLanguage(language)}
          value={code}
          onChange={(value) => onChange(value ?? "")}
          theme="vs-dark"
          loading={
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              Carregando editor…
            </div>
          }
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
          onClick={() => void run()}
          disabled={running}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60 sm:min-h-0 sm:flex-none"
        >
          <Play className="h-4 w-4" />
          {running ? "Executando…" : "Executar"}
        </button>
        {onSave ? (
          <button
            type="button"
            onClick={onSave}
            disabled={saving || !dirty}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-bloom-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-bloom-700 disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-0 sm:flex-none"
          >
            <Save className="h-4 w-4" />
            {saving ? "Salvando…" : "Salvar snippet"}
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => void copy()}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-pastel-lavender px-4 py-2.5 text-sm font-semibold text-bloom-700 hover:brightness-95 sm:min-h-0 sm:flex-none"
        >
          <Copy className="h-4 w-4" />
          Copiar código
        </button>
      </div>

      {output ? (
        <pre
          className={`mt-3 max-h-40 overflow-auto rounded-xl border px-3 py-2 font-mono text-xs whitespace-pre-wrap ${
            output.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-amber-200 bg-amber-50 text-amber-900"
          }`}
        >
          {output.stdout ? `${output.stdout}\n` : ""}
          {output.stderr || (!output.stdout ? "(sem saída)" : "")}
        </pre>
      ) : (
        <p className="mt-3 text-xs text-muted">
          Sandbox JS local (iframe). Python, C e SQL não usam shell do sistema.
        </p>
      )}
    </section>
  );
}
