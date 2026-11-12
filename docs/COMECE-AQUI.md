# Comece aqui 💜

Oi! Este guia é para quem vai mexer no **Study Bloom** pela primeira vez
(incluindo a dona do app 🌸).

## O que é este projeto?

Um aplicativo **para Windows** que organiza a faculdade de Ciência da Computação:
tarefas, grade, disciplinas, lembretes, foco, notas, calendário, flashcards e editor.

Tudo roda **no PC**, sem precisar de internet ou servidor pago.

## Pastas principais (mapa do tesouro)

```
Study-Bloom/
├── README.md          ← visão geral
├── docs/              ← explicações (você está aqui)
├── design/            ← prints e spec do Figma
└── app/               ← código do aplicativo
    ├── src/           ← frontend (telas em React)
    └── src-tauri/     ← “casca” nativa do Windows (Tauri/Rust)
```

## Como rodar no computador

1. Instale (uma vez): **Node.js**, **Rust** e **VS Build Tools** (já feito neste PC).
2. Abra o terminal na pasta do app:

```powershell
cd $env:USERPROFILE\Documents\Study-Bloom\app
npm install
npm run tauri dev
```

Uma janela do Study Bloom deve abrir.

Só ver a interface no navegador (sem janela desktop):

```powershell
npm run dev
```

## Onde estão as telas do Figma?

1. Abra `design/gallery.html` no Chrome/Edge.
2. Ou leia `design/spec/prototype-completo.md`.

## Como o código está organizado?

Pense no padrão **camadas** (parecido com MVC, mas em React moderno):

| Camada | Pasta | Analogia MVC | Função |
|--------|-------|--------------|--------|
| View | `pages/` + `components/` | View | O que a pessoa vê |
| Controller / UI logic | `hooks/` + `stores/` | Controller | Reage a cliques e estado |
| Model | `types/` + `services/` | Model | Dados e banco |

Guia completo: [`ARQUITETURA.md`](ARQUITETURA.md)

## Quero mudar uma tela. O que faço?

1. Ache a tela no Figma / `design/screens/`.
2. Abra o arquivo correspondente em `app/src/pages/` (veja a tabela em `pages/README.md`).
3. Componentes reutilizáveis ficam em `app/src/components/`.
4. Se precisar salvar dado no PC → `app/src/services/`.

## Glossário rápido

- **React** — biblioteca que monta as telas.
- **Tauri** — transforma a interface web em app Windows leve.
- **SQLite** — banco de dados em um arquivo no disco.
- **Tailwind** — classes CSS prontas (cores, espaçamento…).
- **Rota** — endereço interno da tela (`/kanban`, `/notas`…).

## Próximos passos sugeridos

1. Ler [`ARQUITETURA.md`](ARQUITETURA.md)
2. Ler [`COMO-DESENVOLVER.md`](COMO-DESENVOLVER.md)
3. Olhar `design/gallery.html`
4. Começar a implementar a tela 01 fiel ao Figma
