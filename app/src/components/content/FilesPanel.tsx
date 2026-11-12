import { useState } from "react";
import { FileText, Plus } from "lucide-react";
import type { ContentAttachment } from "../../services/content";
import { SimpleModal } from "../ui/SimpleModal";

type FilesPanelProps = {
  attachments: ContentAttachment[];
};

export function FilesPanel({ attachments }: FilesPanelProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <aside className="rounded-2xl border border-bloom-100 bg-surface p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <h3 className="text-base font-bold text-ink">Arquivos e referências</h3>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-bloom-600 px-3 py-2 text-xs font-semibold text-white hover:bg-bloom-700"
        >
          <Plus className="h-3.5 w-3.5" />
          Anexar arquivo
        </button>
      </div>

      <ul className="space-y-2.5">
        {attachments.map((file) => (
          <li
            key={file.id}
            className="flex items-center gap-3 rounded-xl border border-bloom-100 bg-bloom-50/50 px-3 py-3"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-pastel-lavender text-bloom-600">
              <FileText className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">
                {file.name}
              </p>
              <p className="text-xs text-muted">{file.meta}</p>
            </div>
          </li>
        ))}
      </ul>

      <SimpleModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Anexar arquivo"
        description="Upload local em breve — por enquanto é um placeholder visual."
      >
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-ink">Nome do arquivo</span>
          <input
            type="text"
            placeholder="Ex.: Lista de exercícios.pdf"
            className="w-full rounded-xl border border-bloom-200 bg-bloom-50/50 px-3 py-2.5 text-sm outline-none focus:border-bloom-400"
          />
        </label>
      </SimpleModal>
    </aside>
  );
}
