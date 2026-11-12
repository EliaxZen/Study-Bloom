# Auditoria Rei — Study Bloom

Data: 2026-11-11  
Escopo: estabilizar o app após múltiplos agentes (UI, Figma, melhorias, animações, QA).

## Bugs encontrados

### Críticos
1. **Transição de página presa (`AnimatePresence mode="wait"` + `useOutlet`)** — URL mudava e a página antiga permanecia visível (nav/conteúdo dessincronizados).
2. **Kanban: soltar card em cima de outro card não movia** — `over.id` era o id da tarefa, não o status da coluna.

### Médios
3. **Kanban: fantasma duplo no drag** — `transform` no item + `DragOverlay` ao mesmo tempo.
4. **Modal sem focus trap / sem lock de scroll** — Esc existia, mas Tab saía do dialog e o fundo rolava.
5. **Toast com a mesma mensagem não reanimava** — `key={message}` impedia remount no AnimatePresence.

### Polish
6. **Lembretes de hoje sem label “Hoje”** — `formatReminderWhen` só tratava “Amanhã”.
7. **Exit absoluto nas variants de página** — preparado para overlap; depois a transição de rota passou a ser só entrada.

## Correções aplicadas

| Área | Arquivo(s) | Fix |
|------|------------|-----|
| Rotas / motion | `AppShell.tsx` | Removido exit/`AnimatePresence` na troca de página; só fade/rise de entrada |
| Motion helpers | `lib/motion.ts` | Exit variants com `position: absolute` (reserva; páginas não usam mais exit) |
| Kanban DnD | `KanbanPage.tsx` | Resolve status via coluna **ou** card-alvo; overlay sem transform no source |
| Modal a11y | `SimpleModal.tsx` | Focus trap Tab, restore focus, `body` overflow hidden, `useId` |
| Toast | `toastStore.ts`, `AppToast.tsx` | `toastId` crescente como key |
| Datas | `reminders.ts` | Prefixo `Hoje ·` quando a data é o dia corrente |

## QA browser (localhost:1420)

- 10 rotas + deep links `calc-1/integrais`, `redes/camada-de-rede`, `es/git` — conteúdo e `aria-current` ok
- Toast (Favoritos) — ok
- Modal Nova disciplina + Esc — ok
- Flashcards revelar → Acertei — avança 3→4 — ok
- Focus Iniciar/Pausar — ok

## Build

`npm run build` em `app/` — **verde** (`tsc && vite build`).

## Limitações residuais (honestas)

- Modais de criação são placeholder (não persistem)
- SRS de flashcards é mock; baralho mostra total visual (ex.: 12) com poucos cards reais
- Executar código no laboratório é placeholder
- Nav completa (9 itens) vs nav curta do Figma em algumas telas — intencional
- Transição de página **sem exit** (entrada apenas) — trade-off consciente de estabilidade
- Bundle JS grande (~1.4 MB) por Monaco/KaTeX/FullCalendar — aviso do Vite, não regressão funcional

## Confiança

**Alta (~0.85)** para uso demo/namorada: rotas coerentes, CTAs com feedback, Kanban usável, revisão/foco ok, identidade pastel preservada, build limpo. O que falta é persistência real (SQLite/Tauri), não polish de tela.
