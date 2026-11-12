/**
 * Rotas do app (= mapa de URLs → páginas)
 * Cada path bate com uma tela do Figma.
 *
 * Lazy:
 * - Laboratório: Monaco (~MB) fora do chunk inicial
 * - Configurações: backup (fs/dialog) fora do boot crítico
 */

import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { CalendarioPage } from "../pages/CalendarioPage";
import { ConteudoPage } from "../pages/ConteudoPage";
import { DisciplinasPage } from "../pages/DisciplinasPage";
import { GradePage } from "../pages/GradePage";
import { InicioPage } from "../pages/InicioPage";
import { KanbanPage } from "../pages/KanbanPage";
import { LembretesPage } from "../pages/LembretesPage";
import { NotasPage } from "../pages/NotasPage";
import { RevisaoPage } from "../pages/RevisaoPage";

const LaboratorioPage = lazy(() =>
  import("../pages/LaboratorioPage").then((m) => ({ default: m.LaboratorioPage })),
);

const SettingsPage = lazy(() =>
  import("../pages/SettingsPage").then((m) => ({ default: m.SettingsPage })),
);

function RouteFallback({ label }: { label: string }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted">
      {label}
    </div>
  );
}

export function AppRouter() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<InicioPage />} />
        <Route path="kanban" element={<KanbanPage />} />
        <Route path="grade" element={<GradePage />} />
        <Route path="disciplinas" element={<DisciplinasPage />} />
        <Route path="disciplinas/:id/conteudo/:slug" element={<ConteudoPage />} />
        <Route path="lembretes" element={<LembretesPage />} />
        <Route path="notas" element={<NotasPage />} />
        <Route path="calendario" element={<CalendarioPage />} />
        <Route path="revisao" element={<RevisaoPage />} />
        <Route
          path="laboratorio"
          element={
            <Suspense fallback={<RouteFallback label="Carregando laboratório…" />}>
              <LaboratorioPage />
            </Suspense>
          }
        />
        <Route
          path="configuracoes"
          element={
            <Suspense fallback={<RouteFallback label="Carregando configurações…" />}>
              <SettingsPage />
            </Suspense>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
