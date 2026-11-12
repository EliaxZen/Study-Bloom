/**
 * Raiz visual do React
 * --------------------
 * HashRouter funciona bem no Tauri (app desktop).
 */

import { HashRouter } from "react-router-dom";
import { UpdateDialog } from "../components/ui/UpdateDialog";
import { useAppUpdater } from "../hooks/useAppUpdater";
import { AppRouter } from "./router";

function AppWithUpdater() {
  const updater = useAppUpdater();

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
  return (
    <HashRouter>
      <AppWithUpdater />
    </HashRouter>
  );
}
