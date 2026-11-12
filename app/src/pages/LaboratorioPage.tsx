import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { CodeEditorPanel } from "../components/laboratorio/CodeEditorPanel";
import { LatexPanel } from "../components/laboratorio/LatexPanel";
import { SnippetsList } from "../components/laboratorio/SnippetsList";
import { SimpleModal } from "../components/ui/SimpleModal";
import {
  DEFAULT_LATEX,
  DEFAULT_LATEX_PREVIEW,
  DEFAULT_PYTHON,
  listStudyFiles,
} from "../services/laboratory";

type SnippetRow = {
  id: string;
  name: string;
  icon: string;
  tint: "lavender" | "pink" | "mint";
  language: string;
  content: string;
};

const ICONS: Record<string, string> = {
  python: "</>",
  latex: "∫",
  sql: "▦",
};

export function LaboratorioPage() {
  const [code, setCode] = useState(DEFAULT_PYTHON);
  const [language, setLanguage] = useState("Python");
  const [latex, setLatex] = useState(DEFAULT_LATEX);
  const [snippets, setSnippets] = useState<SnippetRow[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    void listStudyFiles().then((files) =>
      setSnippets(
        files.map((f) => ({
          id: f.id,
          name: f.name,
          icon: ICONS[f.language] ?? "⌘",
          tint: f.tint,
          language: f.language,
          content: f.content,
        })),
      ),
    );
  }, []);

  const previewLatex =
    latex.trim() === DEFAULT_LATEX.trim()
      ? DEFAULT_LATEX_PREVIEW
      : latex;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="rounded-full bg-pastel-lavender px-3 py-1.5 text-xs font-semibold text-bloom-700">
          Disciplina: Algoritmos
        </span>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-bloom-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-bloom-700"
        >
          <Plus className="h-4 w-4" />
          Novo arquivo
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]">
        <CodeEditorPanel
          language={language}
          code={code}
          onChange={setCode}
        />
        <div className="space-y-5">
          <LatexPanel
            input={latex}
            onInputChange={setLatex}
            previewLatex={previewLatex}
          />
          <SnippetsList
            items={snippets}
            onSelect={(id) => {
              const item = snippets.find((s) => s.id === id);
              if (!item) return;
              if (item.language === "latex") {
                setLatex(item.content);
                return;
              }
              setLanguage(
                item.language === "sql"
                  ? "SQL"
                  : item.language === "python"
                    ? "Python"
                    : item.language,
              );
              setCode(item.content);
            }}
          />
        </div>
      </div>

      <p className="text-xs text-muted">
        ✦ Protótipo de editor: suporte visual a Python, C, JavaScript, SQL e
        fórmulas LaTeX.
      </p>

      <SimpleModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Novo arquivo"
        description="Crie um snippet de código ou fórmula — persistência em breve."
      >
        <div className="space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink">Nome</span>
            <input
              type="text"
              placeholder="Ex.: media.py"
              className="w-full rounded-xl border border-bloom-200 bg-bloom-50/50 px-3 py-2.5 text-sm outline-none focus:border-bloom-400"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink">Linguagem</span>
            <select className="w-full rounded-xl border border-bloom-200 bg-bloom-50/50 px-3 py-2.5 text-sm outline-none focus:border-bloom-400">
              <option>Python</option>
              <option>SQL</option>
              <option>JavaScript</option>
              <option>C</option>
              <option>LaTeX</option>
            </select>
          </label>
        </div>
      </SimpleModal>
    </div>
  );
}
