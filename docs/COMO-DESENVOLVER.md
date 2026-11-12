# Como desenvolver

## Comandos do dia a dia

Na pasta `app/`:

| Comando | O que faz |
|---------|-----------|
| `npm install` | Instala dependências (só quando mudar o `package.json`) |
| `npm run tauri dev` | Abre o app Windows em modo desenvolvimento |
| `npm run dev` | Abre só o frontend no navegador (mais rápido p/ CSS) |
| `npm run build` | Compila o frontend (checagem) |
| `npm run tauri build` | Gera instalador `.msi` |

## Checklist ao criar uma feature

1. Olhar a tela em `design/screens/`.
2. Abrir/criar a page em `app/src/pages/`.
3. Extrair pedaços repetidos para `components/`.
4. Se precisar de dados: criar/usar função em `services/`.
5. Tipar com `types/`.
6. Testar com `npm run tauri dev`.

## Onde NÃO colocar código

- Não coloque SQL dentro de `pages/`.
- Não coloque HTML grande dentro de `services/`.
- Não copie e cole a mesma sidebar em toda tela — ela já está em `AppShell`.

## Design system (cores)

As cores do Figma estão em `app/src/styles/index.css` (`@theme`).

Exemplos de classes Tailwind:

- `bg-bloom-100`, `text-bloom-700`
- `bg-pastel-pink`, `bg-pastel-mint`, `bg-pastel-lavender`

## Banco de dados

Arquivo preparado: `app/src/services/database.ts`.

Quando formos gravar de verdade:

1. Rodar `runMigrations()` no boot.
2. Trocar mocks dos services por `SELECT` / `INSERT`.

## Dúvidas comuns

**“Preciso saber Rust?”**  
Não para as telas. Só se formos criar comandos nativos novos.

**“Posso usar ChatGPT/Cursor?”**  
Sim — e aponte para `docs/COMECE-AQUI.md` + a pasta `design/` para o contexto.

**“Quebrei algo?”**  
Rode `npm run build` em `app/`. Se passar, o TypeScript está ok.
