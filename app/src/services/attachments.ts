/**
 * Anexos reais (Tauri dialog + fs)
 * --------------------------------
 * Copia arquivos para $APPDATA/attachments/{topicKey}/…
 * Metadados via hooks de content.ts (STORAGE_ATTACHMENTS).
 */

import {
  createContentAttachment,
  listAttachmentsForTopic,
  saveAttachmentsForTopic,
  type ContentAttachment,
} from "./content";

export type { ContentAttachment };

const ROOT_DIR = "attachments";

export function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

function safeSegment(value: string): string {
  return value.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_").trim() || "item";
}

function extensionOf(name: string): string {
  const i = name.lastIndexOf(".");
  if (i <= 0 || i === name.length - 1) return "";
  return name.slice(i + 1).toLowerCase();
}

function kindFromName(name: string): ContentAttachment["kind"] {
  const ext = extensionOf(name);
  const lower = name.toLowerCase();
  if (ext === "pdf") return "pdf";
  if (ext === "md" || ext === "markdown") return "markdown";
  if (ext === "ppt" || ext === "pptx" || ext === "key" || lower.includes("slide")) {
    return "slide";
  }
  if (ext === "url" || ext === "webloc" || lower.startsWith("http")) return "link";
  if (ext === "py" || ext === "txt" || ext === "json" || ext === "csv") {
    return "markdown";
  }
  return "pdf";
}

function kindLabel(kind: ContentAttachment["kind"], ext: string): string {
  switch (kind) {
    case "pdf":
      return ext && ext !== "pdf" ? ext.toUpperCase() : "PDF";
    case "markdown":
      return ext === "py" ? "Python" : ext === "md" || ext === "markdown" ? "Markdown" : ext.toUpperCase() || "Texto";
    case "slide":
      return "Slides";
    case "link":
      return "Link";
    default:
      return "Arquivo";
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  const mb = bytes / (1024 * 1024);
  const text = mb >= 10 ? mb.toFixed(0) : mb.toFixed(1);
  return `${text.replace(".", ",")} MB`;
}

function buildMeta(
  kind: ContentAttachment["kind"],
  name: string,
  sizeBytes: number,
): string {
  return `${kindLabel(kind, extensionOf(name))} · ${formatBytes(sizeBytes)}`;
}

function newAttachmentId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `att_${crypto.randomUUID()}`;
  }
  return `att_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

async function ensureDir(relativeDir: string): Promise<void> {
  const { mkdir, exists, BaseDirectory } = await import("@tauri-apps/plugin-fs");
  const already = await exists(relativeDir, { baseDir: BaseDirectory.AppData });
  if (!already) {
    await mkdir(relativeDir, {
      baseDir: BaseDirectory.AppData,
      recursive: true,
    });
  }
}

/** Lista anexos do tópico (mesmo hook usado por getContentPage). */
export async function listAttachments(
  topicKey: string,
): Promise<ContentAttachment[]> {
  return listAttachmentsForTopic(topicKey);
}

/**
 * Abre o diálogo nativo. Retorna caminho absoluto ou null se cancelar.
 */
export async function pickAttachmentFile(): Promise<string | null> {
  if (!isTauriRuntime()) {
    throw new Error("Anexos só funcionam no app desktop (Tauri).");
  }
  const { open } = await import("@tauri-apps/plugin-dialog");
  const selected = await open({
    multiple: false,
    directory: false,
    title: "Selecionar arquivo para anexar",
    filters: [
      {
        name: "Documentos e notas",
        extensions: [
          "pdf",
          "md",
          "markdown",
          "txt",
          "doc",
          "docx",
          "ppt",
          "pptx",
          "png",
          "jpg",
          "jpeg",
          "webp",
          "py",
          "js",
          "ts",
          "tsx",
          "json",
          "csv",
          "zip",
        ],
      },
      { name: "Todos", extensions: ["*"] },
    ],
  });
  if (selected === null) return null;
  return Array.isArray(selected) ? selected[0] ?? null : selected;
}

/**
 * Browser / deep link: grava só metadados (sem copiar arquivo).
 * Desktop: preferir addAttachmentFromPath após pickAttachmentFile.
 */
export async function addAttachmentReference(
  topicKey: string,
  displayName: string,
): Promise<ContentAttachment> {
  const attachment = await createContentAttachment({ name: displayName });
  const current = await listAttachmentsForTopic(topicKey);
  await saveAttachmentsForTopic(topicKey, [
    attachment,
    ...current.filter((item) => item.id !== attachment.id),
  ]);
  return attachment;
}

/** Copia arquivo para AppData e persiste metadados no hook de conteúdo. */
export async function addAttachmentFromPath(
  topicKey: string,
  sourcePath: string,
  displayName?: string,
): Promise<ContentAttachment> {
  if (!isTauriRuntime()) {
    const name =
      (displayName?.trim() || sourcePath.split(/[/\\]/).pop() || "").trim();
    if (!name) throw new Error("Informe um nome para o arquivo.");
    return addAttachmentReference(topicKey, name);
  }

  const { basename } = await import("@tauri-apps/api/path");
  const { copyFile, stat, BaseDirectory } = await import("@tauri-apps/plugin-fs");

  const originalName = await basename(sourcePath);
  const name = (displayName?.trim() || originalName).trim();
  if (!name) throw new Error("Informe um nome para o arquivo.");

  const id = newAttachmentId();
  const relativeDir = `${ROOT_DIR}/${safeSegment(topicKey)}`;
  const relativePath = `${relativeDir}/${id}__${safeSegment(name)}`;

  await ensureDir(relativeDir);
  await copyFile(sourcePath, relativePath, {
    toPathBaseDir: BaseDirectory.AppData,
  });

  let sizeBytes = 0;
  try {
    const info = await stat(relativePath, { baseDir: BaseDirectory.AppData });
    sizeBytes = info.size;
  } catch {
    try {
      const info = await stat(sourcePath);
      sizeBytes = info.size;
    } catch {
      sizeBytes = 0;
    }
  }

  const kind = kindFromName(name);
  const attachment: ContentAttachment = {
    id,
    name,
    kind,
    meta: buildMeta(kind, name, sizeBytes),
    path: relativePath,
  };

  const current = await listAttachmentsForTopic(topicKey);
  await saveAttachmentsForTopic(topicKey, [attachment, ...current]);
  return attachment;
}

/** Abre com o app padrão do sistema (requer path em AppData). */
export async function openAttachment(
  attachment: ContentAttachment,
): Promise<void> {
  if (!attachment.path) {
    throw new Error("Este anexo não tem arquivo local para abrir.");
  }
  if (!isTauriRuntime()) {
    throw new Error("Abrir arquivo só funciona no app desktop (Tauri).");
  }
  const { appDataDir, join } = await import("@tauri-apps/api/path");
  const { openPath } = await import("@tauri-apps/plugin-opener");
  const absolute = await join(await appDataDir(), attachment.path);
  await openPath(absolute);
}

/** Remove arquivo do disco (se houver) e metadados do tópico. */
export async function removeAttachment(
  topicKey: string,
  attachment: ContentAttachment,
): Promise<void> {
  if (attachment.path && isTauriRuntime()) {
    try {
      const { remove, exists, BaseDirectory } = await import(
        "@tauri-apps/plugin-fs"
      );
      const present = await exists(attachment.path, {
        baseDir: BaseDirectory.AppData,
      });
      if (present) {
        await remove(attachment.path, { baseDir: BaseDirectory.AppData });
      }
    } catch {
      // Metadados ainda são limpos se o arquivo já não existir.
    }
  }

  const current = await listAttachmentsForTopic(topicKey);
  await saveAttachmentsForTopic(
    topicKey,
    current.filter((item) => item.id !== attachment.id),
  );
}
