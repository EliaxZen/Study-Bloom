import { useEffect, useState } from "react";
import { ExternalLink, FileText, Plus, Trash2 } from "lucide-react";
import {
  addAttachmentFromPath,
  addAttachmentReference,
  isTauriRuntime,
  openAttachment,
  pickAttachmentFile,
  removeAttachment,
} from "../../services/attachments";
import type { ContentAttachment } from "../../services/content";
import { useToastStore } from "../../stores/toastStore";
import { SimpleModal } from "../ui/SimpleModal";

type FilesPanelProps = {
  attachments: ContentAttachment[];
  topicKey: string;
  onChanged?: () => void;
};

export function FilesPanel({
  attachments: initialAttachments,
  topicKey,
  onChanged,
}: FilesPanelProps) {
  const showToast = useToastStore((s) => s.show);
  const desktop = isTauriRuntime();
  const [attachments, setAttachments] =
    useState<ContentAttachment[]>(initialAttachments);
  const [modalOpen, setModalOpen] = useState(false);
  const [pickedPath, setPickedPath] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    setAttachments(initialAttachments);
  }, [initialAttachments]);

  useEffect(() => {
    if (!modalOpen) {
      setPickedPath(null);
      setDisplayName("");
    }
  }, [modalOpen]);

  const handlePick = async () => {
    try {
      const path = await pickAttachmentFile();
      if (!path) return;
      setPickedPath(path);
      const base = path.split(/[/\\]/).pop() ?? "";
      setDisplayName(base);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Não foi possível escolher o arquivo.";
      showToast(message);
    }
  };

  const handleSubmit = async () => {
    const name = displayName.trim();
    if (desktop) {
      if (!pickedPath) {
        throw new Error("Selecione um arquivo antes de anexar.");
      }
      const created = await addAttachmentFromPath(topicKey, pickedPath, name);
      setAttachments((prev) => [
        created,
        ...prev.filter((a) => a.id !== created.id),
      ]);
    } else {
      if (!name) {
        throw new Error("Informe o nome do arquivo ou referência.");
      }
      const created = await addAttachmentReference(topicKey, name);
      setAttachments((prev) => [
        created,
        ...prev.filter((a) => a.id !== created.id),
      ]);
    }
    showToast("Arquivo anexado.");
    onChanged?.();
  };

  const handleOpen = async (file: ContentAttachment) => {
    if (!file.path) {
      showToast("Referência sem arquivo local — anexe de novo no desktop para abrir.");
      return;
    }
    setBusyId(file.id);
    try {
      await openAttachment(file);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Não foi possível abrir o arquivo.";
      showToast(message);
    } finally {
      setBusyId(null);
    }
  };

  const handleRemove = async (file: ContentAttachment) => {
    setBusyId(file.id);
    try {
      await removeAttachment(topicKey, file);
      setAttachments((prev) => prev.filter((item) => item.id !== file.id));
      showToast("Arquivo removido.");
      onChanged?.();
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Não foi possível remover o arquivo.";
      showToast(message);
    } finally {
      setBusyId(null);
    }
  };

  const pickedLabel = pickedPath
    ? (pickedPath.split(/[/\\]/).pop() ?? pickedPath)
    : null;

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

      {attachments.length === 0 ? (
        <p className="rounded-xl border border-dashed border-bloom-200 bg-bloom-50/40 px-3 py-6 text-center text-sm text-muted">
          Nenhum arquivo anexado ainda.
          {!desktop
            ? " No browser, adicione uma referência pelo nome."
            : ""}
        </p>
      ) : (
        <ul className="space-y-2.5">
          {attachments.map((file) => (
            <li
              key={file.id}
              className="flex items-center gap-2 rounded-xl border border-bloom-100 bg-bloom-50/50 px-3 py-3"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-pastel-lavender text-bloom-600">
                <FileText className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">
                  {file.name}
                </p>
                <p className="text-xs text-muted">
                  {file.path ? file.meta : `${file.meta} · referência`}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {file.path ? (
                  <button
                    type="button"
                    title="Abrir"
                    aria-label={`Abrir ${file.name}`}
                    disabled={busyId === file.id}
                    onClick={() => {
                      void handleOpen(file);
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-bloom-600 hover:bg-bloom-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </button>
                ) : null}
                <button
                  type="button"
                  title="Remover"
                  aria-label={`Remover ${file.name}`}
                  disabled={busyId === file.id}
                  onClick={() => {
                    void handleRemove(file);
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <SimpleModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Anexar arquivo"
        description={
          desktop
            ? "O arquivo será copiado para a pasta de dados do Study Bloom."
            : "No browser, salve uma referência por nome (cópia de arquivo no app desktop)."
        }
        submitLabel="Anexar"
        onSubmit={handleSubmit}
        submitDisabled={desktop ? !pickedPath : !displayName.trim()}
      >
        <div className="space-y-3">
          {desktop ? (
            <div>
              <button
                type="button"
                onClick={() => {
                  void handlePick();
                }}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-bloom-200 bg-bloom-50/50 px-3 py-2.5 text-sm font-semibold text-bloom-700 hover:bg-bloom-100"
              >
                {pickedLabel ? "Trocar arquivo…" : "Selecionar arquivo…"}
              </button>
              {pickedLabel ? (
                <p
                  className="mt-2 truncate text-xs text-muted"
                  title={pickedPath ?? undefined}
                >
                  Selecionado: {pickedLabel}
                </p>
              ) : (
                <p className="mt-2 text-xs text-muted">
                  Use o diálogo do sistema para escolher o arquivo.
                </p>
              )}
            </div>
          ) : null}

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink">
              Nome de exibição
            </span>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ex.: Lista de exercícios.pdf"
              className="w-full rounded-xl border border-bloom-200 bg-bloom-50/50 px-3 py-2.5 text-sm outline-none focus:border-bloom-400"
            />
          </label>
        </div>
      </SimpleModal>
    </aside>
  );
}
