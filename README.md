# Study Bloom ✿

Organizador universitário de **Ciência da Computação** para Windows.

Feito para gerenciar estudos com a cara do protótipo Figma — leve, local e 100% open source.

---

## Comece por aqui

1. **Nova na equipe?** → [`docs/COMECE-AQUI.md`](docs/COMECE-AQUI.md)
2. **Como as pastas funcionam?** → [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md)
3. **Como rodar / desenvolver?** → [`docs/COMO-DESENVOLVER.md`](docs/COMO-DESENVOLVER.md)
4. **Mapa das 10 telas** → [`docs/TELAS.md`](docs/TELAS.md)
5. **Ver o Figma local** → abra [`design/gallery.html`](design/gallery.html)

---

## Estrutura do repositório

```
Study-Bloom/
├── docs/                 # Documentação em português (leia!)
├── design/               # Prints + spec do Figma
├── app/                  # Código do aplicativo
│   ├── src/              # React (telas, components, services…)
│   └── src-tauri/        # Tauri (janela Windows)
├── README.md
└── .gitignore
```

Dentro de `app/src/` usamos camadas claras (estilo MVC moderno):

| Pasta | Papel |
|-------|-------|
| `pages/` | Telas (View) |
| `components/` | Peças de UI |
| `services/` + `types/` | Dados (Model) |
| `hooks/` + `stores/` | Lógica / estado |

---

## Rodar

```powershell
cd app
npm install
npm run tauri dev
```

---

## Stack (resumo)

Tauri 2 · React 19 · TypeScript · Vite · Tailwind 4 · SQLite  

Detalhes: [`docs/STACK.md`](docs/STACK.md)

---

## Publicar no GitHub

Passos manuais: [`docs/PUBLISH.md`](docs/PUBLISH.md)

---

## Status atual

- [x] Scaffold Tauri + React
- [x] Shell com sidebar e 10 rotas
- [x] Organização + documentação amigável
- [ ] UI fiel ao Figma tela a tela
- [ ] Persistência completa no SQLite
