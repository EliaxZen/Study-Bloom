/**
 * Rotas do app (= mapa de URLs → páginas)
 * Cada path bate com uma tela do Figma.
 */

import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { CalendarioPage } from "../pages/CalendarioPage";
import { ConteudoPage } from "../pages/ConteudoPage";
import { DisciplinasPage } from "../pages/DisciplinasPage";
import { GradePage } from "../pages/GradePage";
import { InicioPage } from "../pages/InicioPage";
import { KanbanPage } from "../pages/KanbanPage";
import { LaboratorioPage } from "../pages/LaboratorioPage";
import { LembretesPage } from "../pages/LembretesPage";
import { NotasPage } from "../pages/NotasPage";
import { RevisaoPage } from "../pages/RevisaoPage";

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
        <Route path="laboratorio" element={<LaboratorioPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
