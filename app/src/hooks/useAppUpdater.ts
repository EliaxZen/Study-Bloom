import { useCallback, useEffect, useRef, useState } from "react";
import type { Update } from "@tauri-apps/plugin-updater";
import { isTauriRuntime } from "../services/notifications";

type UpdateInfo = {
  version: string;
  notes: string | null;
};

/**
 * Checa atualizações só no desktop Tauri.
 * Endpoint: tauri.conf.json → plugins.updater.endpoints
 */
export function useAppUpdater() {
  const [available, setAvailable] = useState<UpdateInfo | null>(null);
  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const updateRef = useRef<Update | null>(null);
  const checked = useRef(false);

  useEffect(() => {
    if (checked.current || !isTauriRuntime()) return;
    checked.current = true;

    let cancelled = false;

    (async () => {
      try {
        const { check } = await import("@tauri-apps/plugin-updater");
        const update = await check();
        if (cancelled || !update) return;

        updateRef.current = update;
        setAvailable({
          version: update.version,
          notes: update.body ?? null,
        });
        setOpen(true);
      } catch {
        // Sem rede / sem release / endpoint ainda placeholder — silencioso
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const dismiss = useCallback(() => {
    if (downloading) return;
    setOpen(false);
    setError(null);
    void updateRef.current?.close().catch(() => undefined);
    updateRef.current = null;
  }, [downloading]);

  const applyUpdate = useCallback(async () => {
    const update = updateRef.current;
    if (!update || downloading) return;

    setDownloading(true);
    setError(null);
    setProgress(null);

    let downloaded = 0;
    let contentLength = 0;

    try {
      await update.downloadAndInstall((event) => {
        if (event.event === "Started") {
          contentLength = event.data.contentLength ?? 0;
          downloaded = 0;
          setProgress(contentLength > 0 ? 0 : null);
        } else if (event.event === "Progress") {
          downloaded += event.data.chunkLength;
          if (contentLength > 0) {
            setProgress(downloaded / contentLength);
          }
        } else if (event.event === "Finished") {
          setProgress(1);
        }
      });

      // macOS/Linux precisam de relaunch; no Windows o installer já encerra o app
      try {
        const { relaunch } = await import("@tauri-apps/plugin-process");
        await relaunch();
      } catch {
        // Windows: processo já pode ter saído — ok
      }
    } catch (e) {
      const message =
        e instanceof Error
          ? e.message
          : "Não deu pra atualizar agora. Tente de novo em um minutinho.";
      setError(message);
      setDownloading(false);
    }
  }, [downloading]);

  return {
    open: open && !!available,
    version: available?.version ?? "",
    notes: available?.notes ?? null,
    downloading,
    progress,
    error,
    dismiss,
    applyUpdate,
  };
}
