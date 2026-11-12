# Responsividade — Study Bloom

Estratégia de layout fluido para o app Tauri (desktop hoje, preparado para mobile/tablet).

## Breakpoints (Tailwind padrão)

| Token | Largura | Uso típico |
|-------|---------|------------|
| (base) | &lt; 640px | Phone — coluna única, drawer |
| `sm` | ≥ 640px | Phone largo / landscape |
| `md` | ≥ 768px | Tablet |
| `lg` | ≥ 1024px | Laptop — sidebar fixa |
| `xl` | ≥ 1280px | Desktop |
| `2xl` | ≥ 1536px | Ultrawide |

Não há sistema paralelo de breakpoints. Para “xs”, use utilitários `min-[…px]:` pontuais.

## AppShell

- **`lg+`**: sidebar permanente (expandida `w-60` ou rail `w-[4.5rem]` com botão Recolher).
- **`&lt; lg`**: sidebar vira drawer off-canvas (`fixed`, `-translate-x-full` fechado). Hamburger no header abre; backdrop + X fecham. Fecha ao mudar de rota ou ao passar para `lg`.
- Conteúdo principal sempre `min-w-0 flex-1` com padding fluido: `px-4 md:px-6 lg:px-8`.
- `overflow-x-hidden` no shell e no `html`/`body` para evitar scroll horizontal do documento.
- Alvos de toque ≥ ~44px (`min-h-11`) em nav/botões no mobile.

## Padrões por tela

| Rota | Comportamento estreito |
|------|------------------------|
| Início | Stats `grid-cols-1 sm:grid-cols-3`; agenda/entregas empilham até `lg` |
| Kanban | Scroll horizontal das colunas (`&lt; lg`); grid 4 colunas em `lg+` (DnD usável) |
| Grade | Grade com `min-w` + `overflow-x-auto` interno (não vaza no documento) |
| Disciplinas | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` |
| Conteúdo | Banner/breadcrumb fluidos; notas + arquivos empilham até `lg` |
| Lembretes / Notas / Calendário / Revisão / Lab | Painéis laterais empilham abaixo de `lg` |
| Notas (tabela) | `overflow-x-auto` + 1ª coluna sticky |
| Calendário | FullCalendar `height: auto`, células menores no phone |
| Laboratório | Monaco + LaTeX empilham; altura do editor `min(42vh, 360px)` |
| Modais | Sheet inferior no phone (`items-end`), CTAs empilhados; painel `max-h` com scroll |
| Toast | Largura limitada a `calc(100vw - 2rem)` |

## Como testar

1. Subir o Vite: `npm run dev` em `app/` → http://localhost:1420/
2. DevTools → Device toolbar (ou CDP `Emulation.setDeviceMetricsOverride`).
3. Larguras mínimas recomendadas: **320, 375, 390, 768, 1024, 1280, 1440, 1920**.
4. Em cada rota HashRouter (`#/`, `#/kanban`, … `#/laboratorio`):
   - sem scroll horizontal do **documento** (`documentElement.scrollWidth ≈ clientWidth`);
   - scroll interno ok (Kanban colunas, Grade, tabela de notas, Monaco);
   - drawer abre/fecha abaixo de `lg`; sidebar aparece em `lg+`.
5. Conferir `prefers-reduced-motion: reduce` (animações já respeitadas via `useReducedMotionPreference`).
6. Build: `npm run build` em `app/`.

Snippet rápido no console:

```js
({
  iw: innerWidth,
  overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  isLg: matchMedia("(min-width: 1024px)").matches,
})
```

## Limitações conhecidas

- **Grade horária** e **tabela de notas** precisam de scroll horizontal interno em telas estreitas (matriz/tabela densas).
- **Kanban** abaixo de `lg` usa carrossel horizontal de colunas (não grid 4 colunas) para manter o DnD.
- **Monaco** pode reportar nós internos mais largos que o viewport; o painel pai contém o overflow e o documento não scrolla.
- App ainda é **desktop Tauri**; drawer/touch preparam port futuro, sem empacotar Android/iOS ainda.
- Não há breakpoint custom `xs` no `@theme` — só Tailwind default + utilitários arbitrários se necessário.

## Arquivos principais

- `app/src/components/layout/AppShell.tsx` — shell + drawer
- `app/src/styles/index.css` — overflow global + calendário fluido
- `app/src/pages/*` — grids e padding por rota
- `app/src/components/ui/SimpleModal.tsx` / `AppToast.tsx` — overlays responsivos
