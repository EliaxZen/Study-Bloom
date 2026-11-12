import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { CodeEditorPanel } from "../components/laboratorio/CodeEditorPanel";
import { LatexPanel } from "../components/laboratorio/LatexPanel";
import { SnippetsList } from "../components/laboratorio/SnippetsList";
import { FormModal } from "../components/ui/FormModal";
import { useSubjects } from "../hooks/useSubjects";
import {
  createStudyFile,
  DEFAULT_LATEX,
  DEFAULT_LATEX_PREVIEW,
  DEFAULT_PYTHON,
  deleteStudyFile,
  labelToLanguage,
  languageToLabel,
  listStudyFiles,
  loadLabDraft,
  saveLabDraft,
  updateStudyFile,
  type LabSnippet,
} from "../services/laboratory";
import { useToastStore } from "../stores/toastStore";

const ICONS: Record<string, string> = {
  python: "</>",
  latex: "∫",
  sql: "▦",
  javascript: "JS",
  c: "C",
  markdown: "MD",
  other: "⌘",
};

type SnippetRow = LabSnippet & { icon: string };

function toRow(f: LabSnippet): SnippetRow {
  return { ...f, icon: ICONS[f.language] ?? "⌘" };
}

export function LaboratorioPage() {
  const { subjects } = useSubjects();
  const showToast = useToastStore((s) => s.show);

  const [subjectId, setSubjectId] = useState("algoritmos");
  const [code, setCode] = useState(DEFAULT_PYTHON);
  const [languageLabel, setLanguageLabel] = useState("Python");
  const [latex, setLatex] = useState(DEFAULT_LATEX);
  const [snippets, setSnippets] = useState<SnippetRow[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [latexFileId, setLatexFileId] = useState<string | null>(null);
  const [savedCode, setSavedCode] = useState(DEFAULT_PYTHON);
  const [savedLatex, setSavedLatex] = useState(DEFAULT_LATEX);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const hydrated = useRef(false);

  const reload = useCallback(async (sid: string) => {
    const files = await listStudyFiles(sid);
    setSnippets(files.map(toRow));
    return files;
  }, []);

  const selectSnippet = useCallback((item: LabSnippet) => {
    setActiveId(item.id);
    if (item.language === "latex") {
      setLatexFileId(item.id);
      setLatex(item.content);
      setSavedLatex(item.content);
      // Painéis independentes: não sobrescreve languageLabel do editor de código.
      return;
    }
    setLanguageLabel(languageToLabel(item.language));
    setCode(item.content);
    setSavedCode(item.content);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const draft = loadLabDraft();
      const sid = draft?.subjectId ?? "algoritmos";
      if (alive) setSubjectId(sid);

      const files = await listStudyFiles(sid);
      if (!alive) return;

      setSnippets(files.map(toRow));

      const firstLatex = files.find((f) => f.language === "latex");
      if (firstLatex) setLatexFileId(firstLatex.id);

      if (draft?.activeId) {
        const found = files.find((f) => f.id === draft.activeId);
        if (found) {
          setActiveId(found.id);
          if (found.language === "latex") {
            setLatexFileId(found.id);
            setSavedLatex(found.content);
            const codeFile = files.find((f) => f.language !== "latex");
            setSavedCode(codeFile?.content ?? DEFAULT_PYTHON);
          } else {
            setSavedCode(found.content);
            setSavedLatex(firstLatex?.content ?? DEFAULT_LATEX);
          }
          setCode(draft.code ?? found.content);
          setLatex(draft.latex ?? firstLatex?.content ?? DEFAULT_LATEX);
          setLanguageLabel(
            draft.languageLabel || languageToLabel(found.language),
          );
          hydrated.current = true;
          return;
        }
      }

      const firstCode = files.find((f) => f.language !== "latex");
      if (firstCode) {
        setActiveId(firstCode.id);
        setCode(firstCode.content);
        setSavedCode(firstCode.content);
        setLanguageLabel(languageToLabel(firstCode.language));
      } else {
        setActiveId(firstLatex?.id ?? null);
      }
      if (firstLatex) {
        setLatex(firstLatex.content);
        setSavedLatex(firstLatex.content);
      }
      // Rascunho persiste mesmo se activeId sumiu (delete) ou era null
      if (draft) {
        if (draft.code) setCode(draft.code);
        if (draft.languageLabel) setLanguageLabel(draft.languageLabel);
        if (draft.latex) setLatex(draft.latex);
      }
      hydrated.current = true;
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    const t = window.setTimeout(() => {
      saveLabDraft({
        subjectId,
        activeId,
        code,
        languageLabel,
        latex,
      });
    }, 350);
    return () => window.clearTimeout(t);
  }, [subjectId, activeId, code, languageLabel, latex]);

  const activeSnippet = useMemo(
    () => snippets.find((s) => s.id === activeId) ?? null,
    [snippets, activeId],
  );

  const isLatexActive = activeSnippet?.language === "latex";
  const codeDirty = !isLatexActive && !!activeSnippet && code !== savedCode;
  const latexDirty = latex !== savedLatex;

  const previewLatex =
    latex.trim() === DEFAULT_LATEX.trim()
      ? DEFAULT_LATEX_PREVIEW
      : latex;

  const subjectName =
    subjects.find((s) => s.id === subjectId)?.name ?? "Disciplina";

  const onSubjectChange = async (nextId: string) => {
    setSubjectId(nextId);
    const files = await reload(nextId);
    const latexFile = files.find((f) => f.language === "latex");
    setLatexFileId(latexFile?.id ?? null);
    if (latexFile) {
      setLatex(latexFile.content);
      setSavedLatex(latexFile.content);
    } else {
      setLatex(DEFAULT_LATEX);
      setSavedLatex(DEFAULT_LATEX);
    }
    const first = files.find((f) => f.language !== "latex") ?? files[0];
    if (!first) {
      setActiveId(null);
      setCode(DEFAULT_PYTHON);
      setSavedCode(DEFAULT_PYTHON);
      setLanguageLabel("Python");
      return;
    }
    selectSnippet(first);
  };

  const saveCodeSnippet = async () => {
    if (!activeId || !activeSnippet || activeSnippet.language === "latex") {
      showToast("Selecione um snippet de código para salvar");
      return;
    }
    setSaving(true);
    try {
      await updateStudyFile(activeId, {
        content: code,
        language: labelToLanguage(languageLabel),
      });
      setSavedCode(code);
      await reload(subjectId);
      showToast("Snippet salvo");
    } finally {
      setSaving(false);
    }
  };

  const saveLatexSnippet = async () => {
    setSaving(true);
    try {
      if (latexFileId) {
        await updateStudyFile(latexFileId, { content: latex });
      } else {
        const created = await createStudyFile({
          name: "formula.tex",
          language: "latex",
          subjectId,
          content: latex,
        });
        setLatexFileId(created.id);
        setActiveId(created.id);
      }
      setSavedLatex(latex);
      await reload(subjectId);
      showToast("Fórmula salva");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await deleteStudyFile(id);
    if (!ok) return;
    const files = await reload(subjectId);
    const wasLatex = latexFileId === id;
    const wasActive = activeId === id;

    if (wasLatex) {
      const otherLatex = files.find((f) => f.language === "latex");
      setLatexFileId(otherLatex?.id ?? null);
      if (!wasActive) {
        if (otherLatex) {
          setLatex(otherLatex.content);
          setSavedLatex(otherLatex.content);
        } else {
          setLatex(DEFAULT_LATEX);
          setSavedLatex(DEFAULT_LATEX);
        }
      }
    }

    if (wasActive) {
      if (files[0]) {
        selectSnippet(files[0]);
        saveLabDraft({
          subjectId,
          activeId: files[0].id,
          code:
            files[0].language === "latex" ? code : files[0].content,
          languageLabel: languageToLabel(files[0].language),
          latex:
            files[0].language === "latex" ? files[0].content : latex,
        });
      } else {
        setActiveId(null);
        setLatexFileId(null);
        setCode(DEFAULT_PYTHON);
        setSavedCode(DEFAULT_PYTHON);
        setLanguageLabel("Python");
        setLatex(DEFAULT_LATEX);
        setSavedLatex(DEFAULT_LATEX);
        saveLabDraft({
          subjectId,
          activeId: null,
          code: DEFAULT_PYTHON,
          languageLabel: "Python",
          latex: DEFAULT_LATEX,
        });
      }
    } else if (wasLatex) {
      saveLabDraft({
        subjectId,
        activeId,
        code,
        languageLabel,
        latex: files.find((f) => f.language === "latex")?.content ?? DEFAULT_LATEX,
      });
    }
    showToast("Snippet removido");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="inline-flex items-center gap-2">
          <span className="sr-only">Disciplina</span>
          <select
            value={subjectId}
            onChange={(e) => void onSubjectChange(e.target.value)}
            className="min-h-11 rounded-full border border-bloom-200 bg-pastel-lavender px-3 py-1.5 text-xs font-semibold text-bloom-700 outline-none focus:border-bloom-400"
          >
            {subjects.length === 0 ? (
              <option value={subjectId}>{subjectName}</option>
            ) : (
              subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))
            )}
          </select>
        </label>
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
          language={languageLabel}
          code={code}
          onChange={setCode}
          onSave={() => void saveCodeSnippet()}
          saving={saving}
          dirty={codeDirty}
        />
        <div className="space-y-5">
          <LatexPanel
            input={latex}
            onInputChange={setLatex}
            previewLatex={previewLatex}
            onSave={() => void saveLatexSnippet()}
            saving={saving}
            dirty={latexDirty}
          />
          <SnippetsList
            items={snippets.map((s) => ({
              id: s.id,
              name: s.name,
              icon: s.icon,
              tint: s.tint,
              language: languageToLabel(s.language),
            }))}
            activeId={activeId}
            onSelect={(id) => {
              const item = snippets.find((s) => s.id === id);
              if (item) selectSnippet(item);
            }}
            onDelete={(id) => void handleDelete(id)}
          />
        </div>
      </div>

      <p className="text-xs text-muted">
        ✦ Edições persistem localmente. Executar: sandbox JavaScript apenas (sem
        shell).
      </p>

      <FormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Novo arquivo"
        description="Crie um snippet de código ou fórmula na disciplina atual."
        submitLabel="Criar arquivo"
        fields={[
          {
            name: "name",
            label: "Nome",
            placeholder: "Ex.: media.py",
            required: true,
          },
          {
            name: "languageLabel",
            label: "Linguagem",
            type: "select",
            required: true,
            options: [
              { value: "Python", label: "Python" },
              { value: "SQL", label: "SQL" },
              { value: "JavaScript", label: "JavaScript" },
              { value: "C", label: "C" },
              { value: "LaTeX", label: "LaTeX" },
            ],
          },
        ]}
        onSubmit={async (values) => {
          const created = await createStudyFile({
            name: values.name,
            language: labelToLanguage(values.languageLabel),
            subjectId,
          });
          await reload(subjectId);
          selectSnippet(created);
          showToast("Arquivo criado");
        }}
      />
    </div>
  );
}
