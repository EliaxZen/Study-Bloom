# Animações — Study Bloom

## Stack

- **[Motion for React](https://motion.dev/docs/react)** (`motion`) — springs, `layoutId`, `AnimatePresence`
- Helpers em `app/src/lib/motion.ts` (transitions, stagger, reduced-motion)

Identidade visual permanece pastel Figma; a qualidade de motion inspira-se em dashboards premium (ex.: Nimbra), sem copiar glass navy.

## O que foi adicionado

| Motion | Onde |
|--------|------|
| Transição de página (fade + rise, só entrada) | `AppShell` — `motion.div` + `key={location.pathname}` (sem exit; evita desync com `useOutlet`) |
| Fio fino de progresso na troca de rota | Topo do `main` no `AppShell` |
| Pill ativa com spring (`layoutId`) | Sidebar nav |
| Hover suave nos itens | Sidebar |
| Collapse para rail de ícones | Botão “Recolher” na sidebar |
| Stagger de cards | Início (stats + disciplinas), Disciplinas (grid), Kanban (colunas) |
| Modal scale + fade | `SimpleModal` |
| Toast enter/exit | `AppToast` |
| Press microinteraction | CTAs, heart, FocusTimer, modal buttons |
| `prefers-reduced-motion` | `useReducedMotionPreference()` — simplifica/desliga |

## Como demoar

1. Clique entre **Início → Kanban → Disciplinas** — veja o pill da sidebar saltar e a página subir/descer.
2. Em **Disciplinas**, abra **Nova disciplina** — modal com scale/fade; feche e veja o exit.
3. Clique no **♥** do header — toast sobe com spring.
4. Use **Recolher** na sidebar — rail de ícones; o pill continua seguindo a rota.
5. Em **Lembretes**, **Iniciar sessão** — micro press no botão.

## Regras de performance

- Preferir `transform` / `opacity`
- Stagger curto (~55 ms); page transition ~320 ms
- Com `prefers-reduced-motion: reduce`, só fades rápidos / sem spring / sem progress thread
