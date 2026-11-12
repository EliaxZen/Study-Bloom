# Study Bloom — escolha de stack (Windows, 100% free)

**Data:** 2026-11-11  
**Veredito:** **Tauri 2 + React 19 + TypeScript + Vite + Tailwind + SQLite**

---

## Por que essa stack

O Study Bloom é UI pesada vinda do Figma (pastel, cards, Kanban, calendário, Monaco, LaTeX). Isso pede **frontend web**. Entre shells desktop free e ativos em 2026:

| Opção | Stars (aprox.) | Licença | Installer | Fit Figma | Veredito |
|-------|----------------|---------|-----------|-----------|----------|
| **Tauri 2** | ~100k+ | Apache-2.0 / MIT | ~3–15 MB | Excelente (HTML/CSS) | **Escolhida** |
| Electron | ~120k+ | MIT | ~80–200 MB | Excelente | Plano B |
| Avalonia | ~30k | MIT | médio | Fraco p/ Figma | Não |
| Flutter Desktop | ~180k (Flutter) | BSD | médio | Reescrever em Dart | Não |
| Wails | ~35k | MIT | pequeno | OK, mas Go + v3 alpha | Não |
| Neutralino | ~8k | OSS | minúsculo | Frágil p/ app grande | Não |
| WPF / WinUI / MAUI | MS OSS | Free | nativo | Difícil fidelidade Figma | Não |

### Critérios do pedido
- **Performance / leveza no PC:** Tauri usa WebView2 do Windows (já instalado), sem Chromium embutido.
- **Atualizações futuras:** plugin updater oficial + ecossistema vivo em 2026.
- **Facilidade de desenvolver o Figma:** React + Tailwind = caminho mais curto até as 10 telas.
- **100% free:** tudo MIT/Apache/BSD — sem SaaS obrigatório, sem licença comercial.

### Projetos open-source reais usando o mesmo padrão (2026)
- **Kairos-Pomodoro** — Tauri 2 + React + SQLite + Pomodoro + analytics (MIT)
- **Genisys** — Tauri 2 + React 19 + Monaco + KaTeX + dnd-kit + SQLite (local-first)
- **Curated Thoughts / Monolith / DBnote** — Tauri 2 + React + SQLite offline-first

---

## Stack recomendada (tudo gratuito)

### Shell desktop
- **[Tauri 2](https://github.com/tauri-apps/tauri)** — Apache-2.0 / MIT  
- Plugins oficiais: `sql`, `fs`, `dialog`, `notification`, `updater`, `store`

### Frontend
- **React 19** + **TypeScript** + **Vite**
- **React Router** — rotas das 10 telas
- **Tailwind CSS 4** — fidelidade visual ao Figma
- **Radix UI + shadcn/ui** — componentes acessíveis (MIT, copy-paste)
- **Lucide React** — ícones
- **Framer Motion** (opcional) — microanimações leves
- **Zustand** — estado UI
- **TanStack Query** (opcional) — cache de leituras locais
- **Zod** — validação
- **date-fns** — datas PT-BR

### Features mapeadas ao protótipo
| Feature Study Bloom | Lib free famosa | Licença |
|---------------------|-----------------|---------|
| Kanban drag-and-drop | [@dnd-kit](https://github.com/clauderic/dnd-kit) | MIT |
| Calendário / grade | [FullCalendar](https://github.com/fullcalendar/fullcalendar) | MIT |
| Editor de código | [Monaco Editor](https://github.com/microsoft/monaco-editor) | MIT |
| LaTeX / fórmulas | [KaTeX](https://github.com/KaTeX/KaTeX) + remark-math | MIT |
| Notas rich text | [Tiptap](https://github.com/ueberdosis/tiptap) | MIT |
| Gráficos (notas/foco) | [Recharts](https://github.com/recharts/recharts) | MIT |
| Banco local | **SQLite** via `@tauri-apps/plugin-sql` | Public domain / MIT wrapper |
| ORM tipado (opcional) | [Drizzle ORM](https://github.com/drizzle-team/drizzle-orm) | Apache-2.0 |
| Flashcards SRS | lógica própria (SM-2) — open algorithm | — |
| Temas | CSS variables + Tailwind | — |

### Backend nativo (mínimo Rust)
Só o necessário via Tauri commands/plugins:
- SQLite persistente no disco do usuário
- Ler/salvar anexos (PDFs, `.md`, `.py`, `.tex`)
- Notificações de lembretes
- Auto-update assinado (quando houver releases)
- Pasta de dados em `%APPDATA%/StudyBloom`

> A maior parte do app fica em TypeScript. Rust não é “o app inteiro” — é a casca nativa.

---

## Arquitetura sugerida

```
Study-Bloom/
  apps/desktop/          # Tauri 2 + Vite + React
    src/                 # UI (telas 01–10)
    src-tauri/           # Rust shell + plugins
  packages/shared/       # tipos Zod, constantes, SRS
  screens/               # referência visual (já existe)
  spec/                  # spec do Figma (já existe)
```

Offline-first: **zero servidor obrigatório**. Tudo no PC dela.

---

## Plano B

**Electron + React + Vite + same frontend stack**  
Se quiser **zero Rust** e aceitar instalador ~150 MB. Mesmo React/Tailwind/Monaco/KaTeX/SQLite (better-sqlite3). Ecossistema máximo (VS Code, Discord).

---

## O que evitar (para este projeto)

- Neutralino / NW.js — ecossistema pequeno / modelo de segurança frágil
- Qt comercial / Avalonia Plus pagos — não precisa
- MAUI como foco — atrito e fidelidade Figma pior
- Flutter Desktop — reescrever UI em Dart longe do Figma
- Firebase/Supabase obrigatório — quebra “100% free local” e privacidade

---

## Próximo passo

1. Confirmar **Tauri 2** (recomendado) ou Electron (plano B)
2. Scaffold do app + shell com sidebar das 10 rotas
3. SQLite + seed das disciplinas de exemplo do Figma
4. Implementar tela 01 (Início) fiel ao screenshot
