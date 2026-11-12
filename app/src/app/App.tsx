/**
 * Raiz visual do React
 * --------------------
 * HashRouter funciona bem no Tauri (app desktop).
 * Boot: runMigrations uma vez antes de montar as rotas.
 */

import { useEffect, useState } from "react";
import { HashRouter } from "react-router-dom";
import { ThemeProvider } from "../components/layout/ThemeProvider";
import { UpdateDialog } from "../components/ui/UpdateDialog";
import { useAppUpdater } from "../hooks/useAppUpdater";
import { useNativeNotifications } from "../hooks/useNativeNotifications";
import { runMigrations } from "../services/database";
import { AppRouter } from "./router";

function AppWithUpdater() {
  const updater = useAppUpdater();
  useNativeNotifications();

  return (
    <>
      <AppRouter />
      <UpdateDialog
        open={updater.open}
        version={updater.version}
        notes={updater.notes}
        downloading={updater.downloading}
        progress={updater.progress}
        error={updater.error}
        onUpdate={updater.applyUpdate}
        onDismiss={updater.dismiss}
      />
    </>
  );
}

export default function App() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await runMigrations();
      } catch (err) {
        // Fora do runtime Tauri (ex.: preview web) o SQL falha — UI ainda sobe
        console.error("[db] runMigrations falhou:", err);
      } finally {
        if (!cancelled) setDbReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!dbReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas text-sm text-muted">
        Preparando banco…
      </div>
    );
  }

  return (
    <ThemeProvider>
      <HashRouter>
        <AppWithUpdater />
      </HashRouter>
    </ThemeProvider>
  );
}
