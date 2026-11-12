# Study Bloom — Spec completo do protótipo Figma

**Salvo em:** 2026-11-11  
**Fonte:** https://www.figma.com/proto/uDoaxsUpykKDnkcdS3qPfi/Study-Bloom-%E2%80%94-Organizador-Universit%C3%A1rio-de-Ci%C3%AAncia-da-Computa%C3%A7%C3%A3o  
**Arquivo design:** https://www.figma.com/design/uDoaxsUpykKDnkcdS3qPfi/  
**File key:** `uDoaxsUpykKDnkcdS3qPfi`  
**Página:** Page 1 (`0:1`)  
**Produto:** Organizador universitário de Ciência da Computação para PC Windows  
**Idioma UI:** PT-BR  
**Tom:** feminino, acolhedor, motivacional (“florescer”)

---

## Identidade & design system

### Marca
- **Nome:** study bloom (lowercase)
- **Tagline:** organize & floresça
- **Logo:** flor estilizada roxa + wordmark bold sans-serif
- **Saudação padrão (maioria das telas 01–06):**  
  - Título: `Olá! Pronta para florescer? ✨`  
  - Sub: `Sua vida acadêmica, um passo de cada vez.`

### Layout global (desktop)
- App shell com **sidebar fixa à esquerda** + **área principal** clara
- Cards com **cantos bem arredondados** (~12–16px), sombra suave, muito whitespace
- Fundo: off-white / cinza muito claro; sidebar branca
- Cartão inferior da sidebar: `✦ Meu semestre` → `2026.2 · Ciência da Computação` (em telas 07–10 aparece abreviado `2026.2 · Computação`)
- Link: `Personalizar tema ↗`

### Paleta (pastel)
| Uso | Cor aproximada |
|-----|----------------|
| Accent / marca / nav ativo | lavanda `#8B5CF6` / `#A78BFA` / fundo ativo `#EDE9FE` |
| Rosa (Cálculo / alta) | `#FCE7F3` / `#FFF1F2` |
| Mint (Redes) | `#D1FAE5` / `#ECFDF5` / `#DCFCE7` |
| Amarelo (BD / revisão) | `#FEF3C7` / `#FEF9C3` |
| Azul claro (Eng. Soft / em progresso) | `#DBEAFE` / similar |
| Texto | charcoal / roxo escuro |
| Editor código | dark charcoal/azul escuro (área interna) |

### Tipografia
- Sans-serif moderna limpa (Inter / similar) — **não** serif display
- Hierarquia: greeting grande bold → section title → body → captions

### Cores por disciplina (sistema)
- **Cálculo 1** → rosa + ícone `∫`
- **Redes** → mint + ícone tipo `⌘` / rede
- **Algoritmos** → lavanda + `</>`
- **Banco de Dados** → amarelo + ícone tabela/DB
- **Engenharia de Software** → azul claro + ícone lápis/draft

---

## Navegação (sidebar)

### Telas 01–06 (nav “curta”)
1. Início  
2. Kanban  
3. Grade horária  
4. Disciplinas  
5. Lembretes  
6. Sessões de foco  

### Telas 07–10 (nav “completa” — alvo da app)
1. Início  
2. Kanban  
3. Grade horária  
4. Disciplinas  
5. Lembretes  
6. Notas e frequência  
7. Calendário  
8. Revisão e flashcards  
9. Editor de código  

> Nota do protótipo: a sidebar **não é 100% consistente** entre frames iniciais e finais. Na implementação, usar a **nav completa** e mapear “Sessões de foco” para a área de foco dentro de Lembretes/Foco (tela 06) ou item dedicado.

---

## Inventário de frames (10/10)

| # | Nome no Figma | Node ID | Rota sugerida |
|---|---------------|---------|---------------|
| 01 | Visão geral | `2:2` | `/` ou `/inicio` |
| 02 | Kanban de tarefas | `2:93` | `/kanban` |
| 03 | Grade horária | `2:194` | `/grade` |
| 04 | Minhas disciplinas | `2:281` | `/disciplinas` |
| 05 | Página de conteúdo | `2:353` | `/disciplinas/:id/conteudo/:slug` |
| 06 | Lembretes e foco | `2:416` | `/lembretes` (+ foco) |
| 07 | Notas e frequência | `5:2` | `/notas` |
| 08 | Calendário acadêmico | `5:108` | `/calendario` |
| 09 | Revisão e flashcards | `5:255` | `/revisao` |
| 10 | Editor de código e LaTeX | `5:340` | `/laboratorio` |

---

## Tela 01 — Visão geral (Início) · `2:2`

**Objetivo:** dashboard diário.

### Conteúdo
- Greeting padrão
- **Stats (2 cards):**
  - Tarefas pendentes → `08` (ícone sparkle roxo)
  - Aulas nesta semana → `14` (ícone sparkle azul)
- **Agenda de hoje** — data exemplo `quarta, 11 nov`
  - `08:00` Cálculo 1 — “Integrais indefinidas” (lavanda)
  - `10:00` Redes de Computadores — “Camada de rede” (mint)
  - `14:00` Algoritmos — “Lista de exercícios” (rosa)
  - `19:00` Revisão — “Sessão de foco · 25 min” (amarelo)
- **Minhas disciplinas** — cards horizontais:
  - Cálculo 1 (`∫`, rosa)
  - Redes (`⌘`, mint)
  - Algoritmos (`</>`, lavanda)

### Interações implícitas
- Clique em item da agenda → disciplina/conteúdo
- Clique em card de disciplina → `/disciplinas/:id`
- Nav → demais módulos

---

## Tela 02 — Kanban de tarefas · `2:93`

**Header:** greeting padrão  
**Título da área:** Quadro de atividades

### Colunas
1. **A fazer (03)**
   - Lista de integrais · Cálculo 1 · tag “Alta prioridade”
   - Estudar sub-redes · Redes · “Média prioridade”
   - Modelar banco · Banco de Dados · “Até sexta”
   - `+ Adicionar tarefa`
2. **Em andamento (02)**
   - Projeto de Python · Algoritmos · “Em progresso”
   - Resumo de SQL · Banco de Dados · “Esta semana”
   - `+ Adicionar tarefa`
3. **Em revisão / concluído** (parcialmente visível)
   - Slides… · Redes · “Revisar”
   - Exerc… · Cálculo… · “Conferido”
   - `+ Adicionar tarefa`

### Card de tarefa
- Título, disciplina, tag de status/prioridade, fundo branco, raio alto

---

## Tela 03 — Grade horária · `2:194`

**Título:** Minha grade semanal  
**Footer copy:** `Cores por disciplina • Horários editáveis • Inclua aulas, monitorias e compromissos`

### Grid
- Eixo X: Segunda, Terça, Quarta (protótipo mostra 3 dias; app deve ter semana completa)
- Eixo Y: 08:00 → 18:00
- Blocos:
  - Seg 08:00 Cálculo 1 · ICC (rosa)
  - Seg 12:00 Redes · Sala B2 (mint)
  - Ter 08:00 Algoritmos · Lab 2 (lavanda)
  - Ter 14:00 Banco de Dados · Sala A4 (amarelo)
  - Qua 08:00 Cálculo 1 · ICC
  - Qua 10:00 Redes · Sala B2

---

## Tela 04 — Minhas disciplinas · `2:281`

**Título:** Biblioteca de matérias

### Cards (grid)
1. **Cálculo 1** — “Integrais, derivadas e aplicações.” · `12 materiais` · rosa + `∫`
2. **Redes de Computadores** — “Protocolos, TCP/IP e roteamento.” · `9 materiais` · mint
3. **Banco de Dados** — “SQL, modelagem e consultas.” · `7 materiais` · amarelo
4. **Engenharia de Software** — “Requisitos, Git e desenvolvimento.” · `6 materiais` · azul

Cada card: header colorido com ícone grande + body branco + badge de materiais.

---

## Tela 05 — Página de conteúdo · `2:353`

**Breadcrumb:** `Disciplinas / Cálculo 1 / Integrais`  
**Banner:** rosa com `∫` + **Cálculo 1**

### Bloco de estudo
- Título: Integrais indefinidas
- Tag: `✦ Conteúdo 01`
- Pergunta: “O que é uma integral indefinida?”
- Definição: família de funções primitivas F(x) cuja derivada é f(x)
- Box fórmula: `∫ f(x) dx = F(x) + C`
- Exemplo: `✦ Exemplo: ∫ 2x dx = x² + C`
- Toolbar `+ Adicionar bloco`: texto · fórmula · checklist · arquivo

> No overview do canvas também aparece coluna **Arquivos e referências** (PDFs, slides, YouTube). Na captura do prototype a coluna pode ficar cortada — **implementar painel direito de arquivos/links**.

---

## Tela 06 — Lembretes e foco · `2:416`

**Título:** Lembretes e sessões de foco  
**Seção:** Seus lembretes

### Lembretes (cards coloridos + ícone relógio)
1. Rosa — Amanhã · 09:00 — Revisar integrais para a prova  
2. Mint — 13 nov · 18:00 — Entregar trabalho de Redes  
3. Amarelo — 16 nov · 14:00 — Praticar consultas SQL  
4. Lavanda — 18 nov · 08:00 — Prova de Cálculo 1  

### Sessões de foco
- Item de nav “Sessões de foco” presente nas telas 01–06
- Agenda do Início já prevê sessão de 25 min (Pomodoro)
- **Implementar:** timer Pomodoro (25:00), botão Iniciar, sessão atual, metas da sessão (mesmo que o frame 06 foque visualmente nos lembretes)

---

## Tela 07 — Notas e frequência · `5:2`

**Título:** Notas e frequência  
**Sub:** Acompanhe seu progresso com tranquilidade.

### Stats
- Média em Cálculo → `7,4`
- Frequência geral → `89%`

### Tabela “Notas por disciplina”
Botão: `+ Adicionar avaliação`  
Colunas: Disciplina | Avaliação 1 | Avaliação 2 | Média

| Disciplina | A1 | A2 | Média |
|------------|----|----|-------|
| Cálculo 1 | 7,0 | 7,8 | 7,4 |
| Redes de Computadores | 8,5 | 9,0 | 8,8 |
| Algoritmos | 9,0 | 8,5 | 8,8 |
| Banco de Dados | 8,2 | — | 8,2 |
| Engenharia de Software | 7,5 | 8,0 | 7,8 |

**Footer:** Configure os pesos das avaliações, os critérios de média e os limites de presença por matéria.

---

## Tela 08 — Calendário acadêmico · `5:108`

**Título:** Calendário acadêmico  
**Sub:** Todas as datas importantes do semestre.  
**Controles:** pill `Novembro de 2026` · `< Hoje >`  
**Grid:** SEG–DOM; dia 11 marcado “Hoje”

### Eventos (exemplos)
- Entrega de lista (rosa) — ~3 nov  
- Revisão SQL (verde) — ~5 nov  
- Redes - trabalho (verde) — 13 nov  
- Prova Cálculo 1 (rosa) — 18 nov  
- Seminário (amarelo) — 20 nov  
- Quiz Algoritmos (azul) — 24 nov  
- Entrega do projeto (roxo) — 27 nov  

**Footer:** Eventos por disciplina, alertas prévios, recorrências e alternância entre mês, semana e lista.

---

## Tela 09 — Revisão e flashcards · `5:255`

**Título:** Revisão inteligente  
**Sub:** Um pouco por dia faz toda a diferença.

### Stats
- Para revisar hoje → `08`
- Sequência de estudos → `05 dias`
- (overview também cita “Cartões dominados: 42” — incluir se couber)

### Flashcard ativo
- Deck: `Flashcards / Redes de Computadores`
- Badges: `Cartão 3 de 12` · `Revisão de hoje`
- Frente: “O que diferencia TCP e UDP?”
- Hint: “Clique para revelar a resposta”
- Botões SRS:
  - **Não lembrei** (rosa)
  - **Quase** (amarelo/laranja)
  - **Acertei** (verde)
- Nota: “Próxima revisão calculada conforme o desempenho”
- Footer: Revisão espaçada; intervalos configuráveis por matéria
- Decks (overview): Redes, Cálculo 1, Algoritmos, Banco de Dados

---

## Tela 10 — Editor de código e LaTeX · `5:340`

**Título:** Laboratório de estudos  
**Sub:** Seu espaço para programar e escrever matemática.  
**Badge:** Disciplina: Algoritmos

### Editor de código
- Label linguagem: `Python`
- Área dark com linhas 01–07, snippet:

```python
def media(notas):
    if not notas:
        return 0
    return sum(notas) / len(notas)

notas = [7.0, 8.5, 9.0]
print(f'Média: {media(notas):.2f}')
```

- Botões: `Executar (futuro)` (verde + play) · `Copiar código` (lavanda)
- Caption: “Blocos de código com linguagem, título e anexos.”
- Nota final: suporte visual a **Python, C, JavaScript, SQL e fórmulas LaTeX**

---

## Domínio / entidades (para implementar)

1. **Semester** — ano.periodo, curso, tema
2. **Subject (Disciplina)** — nome, cor, ícone, descrição, materiais_count
3. **ScheduleBlock** — dia, hora início/fim, sala, subject_id
4. **Task (Kanban)** — título, subject, coluna (todo/doing/review/done), prioridade/tag, prazo
5. **AgendaItem** — data/hora, subject, descrição, tipo (aula/tarefa/foco)
6. **ContentBlock** — subject, título, tipo (texto/fórmula/checklist/arquivo), body, ordem
7. **Attachment/Reference** — nome, tipo (pdf/slide/link/youtube), url
8. **Reminder** — datetime, título, cor
9. **FocusSession** — duração (25), status, metas
10. **Grade** — subject, avaliações[], média, pesos
11. **Attendance** — subject, percentual / faltas
12. **CalendarEvent** — data, título, subject/cor, tipo
13. **FlashcardDeck / Card** — subject, Q/A, SRS state (due, interval, streak)
14. **CodeSnippet** — subject, language, title, code, anexos

---

## Requisitos de plataforma (pedido do usuário)

- App **Windows desktop**
- Stack sugerida (não definida no Figma): Electron + React/Vite **ou** Tauri + React — UI web fiel ao Figma
- Persistência local (SQLite / IndexedDB) — app pessoal, offline-first
- Temas personalizáveis (link já no UI)

---

## Observações de fidelidade

1. Greeting “Pronta para florescer” → copy feminina; manter como no protótipo.
2. Nav divergente entre frames iniciais e finais → unificar na nav completa.
3. Grade mostra 3 dias no mock → implementar semana (seg–sex ou seg–dom).
4. Editor: botão “Executar (futuro)” = placeholder; LaTeX é requisito visual.
5. Flashcards = SRS simples (3 botões).
6. MCP Figma da conta autenticada (`Erica` / View seat) **não tem edit access** → `get_design_context` / `get_metadata` bloqueados. Análise feita via browser no design + prototype. Para handoff pixel-perfect via MCP, compartilhar o arquivo com **can edit**.

---

## Status desta memória

- [x] 10/10 frames identificados com node IDs  
- [x] Conteúdo textual e estrutura de cada tela documentados  
- [x] Design system, cores por disciplina, entidades  
- [x] Pronto para usar como fonte única ao construir o app Windows  
