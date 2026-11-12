import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { CheckSquare, FileText, Sigma, Trash2, Type } from "lucide-react";
import "katex/dist/katex.min.css";
import {
  parseChecklistBody,
  serializeChecklist,
  type ChecklistItem,
  type ContentBlock,
  type ContentBlockKind,
} from "../../services/content";
import { SimpleModal } from "../ui/SimpleModal";

type ContentNotesProps = {
  title: string;
  tag: string;
  blocks: ContentBlock[];
  onTitleChange: (title: string) => void;
  onTagChange: (tag: string) => void;
  onBlocksChange: (blocks: ContentBlock[]) => void;
  onAddBlock: (kind: ContentBlockKind) => void;
  onRemoveBlock: (blockId: string) => void;
  /** Hook para o agente de anexos — bloco tipo arquivo */
  onFileBlockAction?: (blockId: string) => void;
};

const KIND_LABEL: Record<ContentBlockKind, string> = {
  text: "Texto",
  formula: "Fórmula",
  checklist: "Checklist",
  file: "Arquivo",
};

export function ContentNotes({
  title,
  tag,
  blocks,
  onTitleChange,
  onTagChange,
  onBlocksChange,
  onAddBlock,
  onRemoveBlock,
  onFileBlockAction,
}: ContentNotesProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [draftTitle, setDraftTitle] = useState(title);
  const [draftTag, setDraftTag] = useState(tag);

  useEffect(() => {
    setDraftTitle(title);
    setDraftTag(tag);
  }, [title, tag]);

  function updateBlockBody(blockId: string, body: string) {
    onBlocksChange(
      blocks.map((b) => (b.id === blockId ? { ...b, body } : b)),
    );
  }

  function toggleCheck(blockId: string, itemId: string) {
    const block = blocks.find((b) => b.id === blockId);
    if (!block || block.kind !== "checklist") return;
    const items = parseChecklistBody(block.body).map((item) =>
      item.id === itemId ? { ...item, done: !item.done } : item,
    );
    updateBlockBody(blockId, serializeChecklist(items));
  }

  function updateCheckText(blockId: string, itemId: string, text: string) {
    const block = blocks.find((b) => b.id === blockId);
    if (!block || block.kind !== "checklist") return;
    const items = parseChecklistBody(block.body).map((item) =>
      item.id === itemId ? { ...item, text } : item,
    );
    updateBlockBody(blockId, serializeChecklist(items));
  }

  function addCheckItem(blockId: string) {
    const block = blocks.find((b) => b.id === blockId);
    if (!block || block.kind !== "checklist") return;
    const items: ChecklistItem[] = [
      ...parseChecklistBody(block.body),
      {
        id: `ci_${Date.now().toString(36)}`,
        text: "Novo item",
        done: false,
      },
    ];
    updateBlockBody(blockId, serializeChecklist(items));
  }

  function removeCheckItem(blockId: string, itemId: string) {
    const block = blocks.find((b) => b.id === blockId);
    if (!block || block.kind !== "checklist") return;
    const items = parseChecklistBody(block.body).filter(
      (item) => item.id !== itemId,
    );
    updateBlockBody(blockId, serializeChecklist(items));
  }

  return (
    <section className="rounded-2xl border border-bloom-100 bg-surface p-6 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={draftTitle}
          onChange={(e) => setDraftTitle(e.target.value)}
          onBlur={() => {
            const next = draftTitle.trim() || title;
            setDraftTitle(next);
            if (next !== title) onTitleChange(next);
          }}
          className="min-w-0 flex-1 bg-transparent text-xl font-bold text-ink outline-none focus:underline"
          aria-label="Título do conteúdo"
        />
        <input
          value={draftTag}
          onChange={(e) => setDraftTag(e.target.value)}
          onBlur={() => {
            if (draftTag !== tag) onTagChange(draftTag);
          }}
          className="max-w-[10rem] rounded-full bg-pastel-lavender px-3 py-1 text-xs font-semibold text-bloom-700 outline-none focus:ring-2 focus:ring-bloom-300"
          aria-label="Tag do conteúdo"
        />
      </div>

      <div className="mt-5 space-y-4">
        {blocks.length === 0 ? (
          <p className="rounded-xl border border-dashed border-bloom-200 bg-bloom-50/40 px-3 py-8 text-center text-sm text-muted">
            Nenhum bloco ainda. Adicione texto, fórmula, checklist ou arquivo.
          </p>
        ) : null}
        {blocks.map((block) => {
          const editing = editingId === block.id;

          return (
            <div
              key={block.id}
              className="group relative rounded-xl border border-transparent px-1 py-2 hover:border-bloom-100 hover:bg-bloom-50/40"
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-[10px] font-semibold tracking-wide text-muted uppercase">
                  {KIND_LABEL[block.kind] ?? "Bloco"}
                </span>
                <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                  <button
                    type="button"
                    className="rounded-lg px-2 py-1 text-xs font-medium text-bloom-600 hover:bg-bloom-100"
                    onClick={() =>
                      setEditingId(editing ? null : block.id)
                    }
                  >
                    {editing ? "Fechar" : "Editar"}
                  </button>
                  <button
                    type="button"
                    className="rounded-lg p-1 text-muted hover:bg-rose-50 hover:text-rose-600"
                    aria-label="Remover bloco"
                    onClick={() => {
                      if (editingId === block.id) setEditingId(null);
                      onRemoveBlock(block.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {block.kind === "text" &&
                (editing ? (
                  <textarea
                    value={block.body}
                    onChange={(e) =>
                      updateBlockBody(block.id, e.target.value)
                    }
                    rows={5}
                    className="w-full rounded-xl border border-bloom-200 bg-white px-3 py-2 text-sm outline-none focus:border-bloom-400"
                  />
                ) : (
                  <div className="prose-bloom text-sm leading-relaxed text-ink">
                    <ReactMarkdown
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                    >
                      {block.body}
                    </ReactMarkdown>
                  </div>
                ))}

              {block.kind === "formula" &&
                (editing ? (
                  <textarea
                    value={block.body}
                    onChange={(e) =>
                      updateBlockBody(block.id, e.target.value)
                    }
                    rows={2}
                    className="w-full rounded-xl border border-bloom-200 bg-white px-3 py-2 font-mono text-sm outline-none focus:border-bloom-400"
                    placeholder="LaTeX…"
                  />
                ) : (
                  <div className="prose-bloom text-sm">
                    <ReactMarkdown
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                    >
                      {`$$\n${block.body}\n$$`}
                    </ReactMarkdown>
                  </div>
                ))}

              {block.kind === "checklist" && (
                <ul className="space-y-2">
                  {parseChecklistBody(block.body).map((item) => (
                    <li key={item.id} className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={item.done}
                        onChange={() => toggleCheck(block.id, item.id)}
                        className="mt-1 h-4 w-4 accent-bloom-600"
                      />
                      {editing ? (
                        <input
                          value={item.text}
                          onChange={(e) =>
                            updateCheckText(block.id, item.id, e.target.value)
                          }
                          className="min-w-0 flex-1 rounded-lg border border-bloom-200 bg-white px-2 py-1 text-sm outline-none focus:border-bloom-400"
                        />
                      ) : (
                        <span
                          className={`min-w-0 flex-1 text-sm ${item.done ? "text-muted line-through" : "text-ink"}`}
                        >
                          {item.text}
                        </span>
                      )}
                      {editing ? (
                        <button
                          type="button"
                          className="rounded-lg p-1 text-muted hover:bg-rose-50 hover:text-rose-600"
                          aria-label="Remover item"
                          onClick={() => removeCheckItem(block.id, item.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      ) : null}
                    </li>
                  ))}
                  {editing ? (
                    <button
                      type="button"
                      onClick={() => addCheckItem(block.id)}
                      className="text-xs font-medium text-bloom-600 hover:underline"
                    >
                      + Item
                    </button>
                  ) : null}
                </ul>
              )}

              {block.kind === "file" && (
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-bloom-200 bg-bloom-50/50 px-3 py-3">
                  <FileText className="h-4 w-4 text-bloom-600" />
                  {editing ? (
                    <input
                      value={block.body}
                      onChange={(e) =>
                        updateBlockBody(block.id, e.target.value)
                      }
                      className="min-w-0 flex-1 rounded-lg border border-bloom-200 bg-white px-2 py-1 text-sm outline-none focus:border-bloom-400"
                      placeholder="Nome / referência do arquivo"
                    />
                  ) : (
                    <p className="text-sm text-ink">{block.body}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => onFileBlockAction?.(block.id)}
                    className="text-xs font-medium text-bloom-600 hover:underline"
                  >
                    Abrir anexos
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => setAddOpen(true)}
        className="mt-8 text-left text-sm font-medium text-bloom-600 hover:text-bloom-700 hover:underline"
      >
        + Adicionar bloco: texto · fórmula · checklist · arquivo
      </button>

      <SimpleModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Adicionar bloco"
        description="Escolha o tipo de bloco para este tópico."
        hideFooter
      >
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ["text", Type, "Texto"],
              ["formula", Sigma, "Fórmula"],
              ["checklist", CheckSquare, "Checklist"],
              ["file", FileText, "Arquivo"],
            ] as const
          ).map(([kind, Icon, label]) => (
            <button
              key={kind}
              type="button"
              onClick={() => {
                onAddBlock(kind);
                setAddOpen(false);
              }}
              className="flex min-h-11 items-center gap-2 rounded-xl border border-bloom-100 bg-bloom-50/60 px-3 py-3 text-sm font-medium text-ink hover:border-bloom-300 hover:bg-bloom-100/70"
            >
              <Icon className="h-4 w-4 text-bloom-600" />
              {label}
            </button>
          ))}
        </div>
      </SimpleModal>
    </section>
  );
}
