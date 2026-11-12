# Mapa de entrega — Study Bloom

Visão do que cada frente entregou (para o namorado e para o instalador).

| Frente | Artefato | Status | O que entregou |
|--------|----------|--------|----------------|
| Figma / telas | `docs/TELAS.md` + `design/` | Feito | 10 telas ↔ rotas ↔ arquivos |
| Animações | `docs/ANIMACOES.md` | Feito | Motion (página, sidebar, modais, toast, reduced-motion) |
| Validação / build UI | (build verde citado na auditoria) | Feito | `npm run build` OK no momento da auditoria |
| Agente Rei (QA + bugs) | `docs/AUDITORIA-REI.md` | Feito | Fixes: transição de página, Kanban DnD, modal a11y, toast, “Hoje” |
| Responsividade | `docs/RESPONSIVIDADE.md` | Feito | Drawer mobile, grids fluidos, touch targets, overflow controlado |
| Instalador + updates | `docs/INSTALADOR-E-UPDATES.md` + `docs/PUBLISH.md` | Este agente | NSIS/MSI, updater assinado, diálogo pastel, docs de publish |

## Stack rápida

- Frontend: React + Vite + Tailwind 4 + Motion — `app/`
- Desktop: Tauri 2 — identifier `com.studybloom.desktop`, versão `0.1.0`
- Dados: SQLite via `tauri-plugin-sql` em AppData
- Updater: `tauri-plugin-updater` + `tauri-plugin-process`

## Limitações honestas (herdadas)

- Muitos fluxos de criação ainda são placeholder (não persistem de verdade)
- Auto-update depende de ele subir Release + `latest.json` no GitHub
- Bundle web grande (Monaco / KaTeX / FullCalendar)
