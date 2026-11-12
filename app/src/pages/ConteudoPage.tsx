import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ContentBanner } from "../components/content/ContentBanner";
import { ContentNotes } from "../components/content/ContentNotes";
import { FilesPanel } from "../components/content/FilesPanel";
import { FavoritePinButton } from "../components/favorites/FavoritePinButton";
import { StatusMessage } from "../components/ui/StatusMessage";
import {
  addContentBlock,
  getContentPage,
  removeContentBlock,
  saveTopicBlocks,
  updateTopicMeta,
  type ContentBlock,
  type ContentBlockKind,
  type ContentPageData,
} from "../services/content";
import { updateSubject } from "../services/subjects";
import { contentFavoriteId } from "../stores/favoritesStore";
import { useToastStore } from "../stores/toastStore";
import type { SubjectColor } from "../types";

export function ConteudoPage() {
  const { id, slug } = useParams();
  const showToast = useToastStore((s) => s.show);
  const [data, setData] = useState<ContentPageData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setLoadError(null);
      const page = await getContentPage(id, slug);
      setData(page);
    } catch (e) {
      setLoadError(
        e instanceof Error ? e.message : "Não foi possível carregar o conteúdo.",
      );
    }
  }, [id, slug]);

  useEffect(() => {
    setData(null);
    void reload();
  }, [reload]);

  async function persistBlocks(blocks: ContentBlock[]) {
    if (!data) return;
    setData((prev) => (prev ? { ...prev, blocks } : prev));
    await saveTopicBlocks(data.topicId, blocks);
  }

  async function handleTitleChange(title: string) {
    if (!data) return;
    setData((prev) => (prev ? { ...prev, title } : prev));
    await updateTopicMeta(data.topicId, { title });
  }

  async function handleTagChange(tag: string) {
    if (!data) return;
    setData((prev) => (prev ? { ...prev, tag } : prev));
    await updateTopicMeta(data.topicId, { tag });
  }

  async function handleAddBlock(kind: ContentBlockKind) {
    if (!data) return;
    // Flush edits em memória antes do create — evita race com saveTopicBlocks.
    await saveTopicBlocks(data.topicId, data.blocks);
    const block = await addContentBlock(data.topicId, kind);
    if (!block) {
      showToast("Não foi possível adicionar o bloco");
      return;
    }
    setData((prev) =>
      prev ? { ...prev, blocks: [...prev.blocks, block] } : prev,
    );
    showToast(`Bloco ${kind} adicionado`);
  }

  async function handleRemoveBlock(blockId: string) {
    if (!data) return;
    await saveTopicBlocks(data.topicId, data.blocks);
    const ok = await removeContentBlock(data.topicId, blockId);
    if (!ok) {
      showToast("Não foi possível remover o bloco");
      return;
    }
    setData((prev) =>
      prev
        ? { ...prev, blocks: prev.blocks.filter((b) => b.id !== blockId) }
        : prev,
    );
  }

  async function handleSaveCover(next: {
    icon: string;
    color: SubjectColor;
  }) {
    if (!data) return;
    // Só ícone/cor — não reenviar name (evita sobrescrever edição em Disciplinas).
    await updateSubject(data.subjectId, {
      icon: next.icon,
      color: next.color,
    });
    setData((prev) =>
      prev
        ? {
            ...prev,
            subjectIcon: next.icon,
            subjectColor: next.color,
          }
        : prev,
    );
    showToast("Capa atualizada");
  }

  /** Hook anexos: bloco arquivo aponta o painel lateral. */
  function handleFileBlockAction() {
    const panel = document.getElementById("content-attachments-panel");
    panel?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    showToast("Use o painel de anexos ao lado");
  }

  if (loadError) {
    return <StatusMessage variant="error">{loadError}</StatusMessage>;
  }

  if (!data) {
    return <StatusMessage variant="loading">Carregando conteúdo…</StatusMessage>;
  }

  const contentPath = `/disciplinas/${data.subjectId}/conteudo/${data.slug}`;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <nav className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-muted">
          <Link
            to="/disciplinas"
            className="hover:text-bloom-600 hover:underline"
          >
            Disciplinas
          </Link>
          <span aria-hidden>/</span>
          <span className="max-w-[12rem] truncate sm:max-w-none">
            {data.subjectName}
          </span>
          <span aria-hidden>/</span>
          <span className="max-w-full font-medium break-words text-ink">
            {data.breadcrumb}
          </span>
        </nav>
        <FavoritePinButton
          size="sm"
          item={{
            id: contentFavoriteId(data.subjectId, data.slug),
            kind: "content",
            title: data.title,
            subtitle: data.subjectName,
            path: contentPath,
            icon: data.subjectIcon,
            color: data.subjectColor,
          }}
        />
      </div>

      <ContentBanner
        icon={data.subjectIcon}
        subjectName={data.subjectName}
        color={data.subjectColor}
        onSaveCover={handleSaveCover}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]">
        <ContentNotes
          key={data.topicKey}
          title={data.title}
          tag={data.tag}
          blocks={data.blocks}
          onTitleChange={handleTitleChange}
          onTagChange={handleTagChange}
          onBlocksChange={(blocks) => {
            void persistBlocks(blocks);
          }}
          onAddBlock={(kind) => {
            void handleAddBlock(kind);
          }}
          onRemoveBlock={(blockId) => {
            void handleRemoveBlock(blockId);
          }}
          onFileBlockAction={handleFileBlockAction}
        />
        <div id="content-attachments-panel">
          <FilesPanel
            key={data.topicKey}
            attachments={data.attachments}
            topicKey={data.topicKey}
            onChanged={() => {
              void reload();
            }}
          />
        </div>
      </div>
    </div>
  );
}
