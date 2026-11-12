# Arquitetura do Study Bloom

Explicação simples de como as pastas se encaixam.

## Visão geral

```
Usuária clica na tela (pages/components)
        ↓
   hooks / stores   ← estado e efeitos
        ↓
     services       ← busca/grava dados
        ↓
  SQLite / arquivos ← PC local (Tauri)
```

## Pastas dentro de `app/src/`

```
src/
├── app/           # Liga o React + define as rotas
├── pages/         # Telas inteiras (1 arquivo ≈ 1 tela do Figma)
├── components/    # Peças reutilizáveis (sidebar, cards…)
├── hooks/         # Lógica React reaproveitável
├── stores/        # Estado global (Zustand)
├── services/      # Banco, arquivos, notificações
├── types/         # Formato dos dados (TypeScript)
├── constants/     # Menu, textos fixos
├── lib/           # Utilitários (ex.: cn)
├── styles/        # CSS + tema
└── assets/        # Imagens estáticas pequenas
```

## Comparação com MVC

| MVC clássico | No Study Bloom |
|--------------|----------------|
| **Model** | `types/` + `services/` (+ SQLite) |
| **View** | `pages/` + `components/` |
| **Controller** | `hooks/` + um pouco de `stores/` + eventos nos componentes |

Não usamos pastas chamadas `models/` / `controllers/` porque no React da comunidade o padrão acima é o mais comum e fácil de achar tutoriais.

## Frontend vs backend

- **Frontend (`src/`)** — TypeScript + React. Quase tudo do visual.
- **Backend nativo (`src-tauri/`)** — Rust + Tauri. Janela do Windows, permissões, plugins (SQL, arquivos…).

A namorada pode trabalhar **muito tempo só no frontend** sem mexer em Rust.

## Fluxo de um exemplo real

1. Página `InicioPage` chama o hook `useSubjects()`.
2. O hook chama `listSubjects()` em `services/subjects.ts`.
3. Hoje retorna dados mock (iguais ao Figma).
4. Depois, o mesmo service fará `SELECT` no SQLite.

Assim a tela **não muda** quando trocarmos mock → banco.

## Regras de ouro (para não bagunçar)

1. Página não fala direto com SQLite → usa `services/`.
2. Se o pedaço de UI aparece em 2+ telas → vira `component`.
3. Se a lógica usa `useState`/`useEffect` e se repete → vira `hook`.
4. Nomes em português nas **docs**; código em inglês (padrão da comunidade).
5. Cada tela do Figma tem um arquivo em `pages/` — não misture 3 telas no mesmo arquivo.
