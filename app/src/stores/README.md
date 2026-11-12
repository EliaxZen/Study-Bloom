# stores/

**O que é:** estado global da interface (Zustand).

Use quando várias telas precisam do mesmo dado em memória
(ex.: semestre atual, tema, timer de foco).

Para dados persistentes (gravar no PC), prefira `services/`.

## themeStore (P3 + P4 compartilhado)

- `presetId` / `accentHex` — accent pastel (P3); aplica `--color-bloom-*`, `--color-primary`, `--color-accent`
- `mode` — `light` | `dark` | `system` (P4); aplica `data-theme` / `.dark`
- Persistência: `services/themePersistence.ts` (plugin-store + localStorage)
- UI accent: `ThemePersonalizeModal` · UI mode: `ThemeToggle`
