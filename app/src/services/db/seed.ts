/**
 * Seed demo (Figma) — só se subjects estiver vazio.
 */

import type Database from "@tauri-apps/plugin-sql";

const PYTHON_SNIPPET = `def media(notas):
    if not notas:
        return 0
    return sum(notas) / len(notas)

notas = [7.0, 8.5, 9.0]
print(f'Média: {media(notas):.2f}')
`;

export async function isDatabaseEmpty(db: Database): Promise<boolean> {
  const rows = await db.select<{ c: number }[]>(
    "SELECT COUNT(*) AS c FROM subjects",
  );
  return (rows[0]?.c ?? 0) === 0;
}

/** Insere dados de demonstração. Retorna true se seedou. */
export async function seedIfEmpty(db: Database): Promise<boolean> {
  if (!(await isDatabaseEmpty(db))) return false;

  await db.execute(
    `INSERT INTO semester (id, label, course, is_active) VALUES ($1, $2, $3, $4)`,
    ["2026-2", "2026.2", "Ciência da Computação", 1],
  );

  const subjects: [string, string, string, string, string, number, number][] = [
    ["calc-1", "Cálculo 1", "Integrais, derivadas e aplicações.", "pink", "∫", 12, 0],
    ["redes", "Redes de Computadores", "Protocolos, TCP/IP e roteamento.", "mint", "⌘", 9, 1],
    ["algoritmos", "Algoritmos e Programação", "Python, estruturas e projetos.", "lavender", "</>", 16, 2],
    ["bd", "Banco de Dados", "SQL, modelagem e consultas.", "yellow", "▦", 7, 3],
    ["es", "Engenharia de Software", "Requisitos, Git e desenvolvimento.", "blue", "✎", 6, 4],
  ];
  for (const [id, name, description, color, icon, materials, order] of subjects) {
    await db.execute(
      `INSERT INTO subjects (id, semester_id, name, description, color, icon, materials_count, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [id, "2026-2", name, description, color, icon, materials, order],
    );
  }

  const tasks: [string, string, string, string, string][] = [
    ["t1", "Lista de integrais", "calc-1", "todo", "Alta prioridade"],
    ["t2", "Estudar sub-redes", "redes", "todo", "Média prioridade"],
    ["t3", "Modelar banco", "bd", "todo", "Até sexta"],
    ["t4", "Projeto de Python", "algoritmos", "doing", "Em progresso"],
    ["t5", "Resumo de SQL", "bd", "doing", "Esta semana"],
    ["t6", "Slides de Redes", "redes", "review", "Revisão"],
    ["t7", "Exercícios de limites", "calc-1", "review", "Conferir"],
    ["t8", "Quiz de derivadas", "calc-1", "done", "Finalizado"],
    ["t9", "Configurar Git", "es", "done", "Finalizado"],
    ["t10", "Leitura de RFC", "redes", "done", "Finalizado"],
    ["t11", "Lista de funções", "calc-1", "done", "Finalizado"],
  ];
  for (let i = 0; i < tasks.length; i++) {
    const [id, title, subjectId, status, tag] = tasks[i];
    await db.execute(
      `INSERT INTO tasks (id, title, subject_id, status, tag, due_date, sort_order)
       VALUES ($1, $2, $3, $4, $5, NULL, $6)`,
      [id, title, subjectId, status, tag, i],
    );
  }

  const slots: [string, string | null, number, string, string, string, string, string][] = [
    ["s1", "calc-1", 1, "08:00", "10:00", "ICC", "Cálculo 1", "pink"],
    ["s2", "redes", 1, "12:00", "14:00", "Sala B2", "Redes", "mint"],
    ["s3", "algoritmos", 2, "08:00", "10:00", "Lab 2", "Algoritmos", "lavender"],
    ["s4", "bd", 2, "14:00", "16:00", "Sala A4", "Banco de Dados", "yellow"],
    ["s5", "calc-1", 3, "08:00", "10:00", "ICC", "Cálculo 1", "pink"],
    ["s6", "redes", 3, "10:00", "12:00", "Sala B2", "Redes", "mint"],
    ["s7", "algoritmos", 4, "12:00", "14:00", "Lab 2", "Algoritmos", "lavender"],
    ["s8", "bd", 4, "16:00", "18:00", "Sala A4", "Banco de Dados", "yellow"],
    ["s9", "es", 5, "10:00", "12:00", "Sala multiuso", "Projeto de Extensão", "blue"],
    ["s10", null, 5, "14:00", "16:00", "Online", "Monitoria", "mint"],
  ];
  for (const [id, subjectId, day, start, end, room, title, color] of slots) {
    await db.execute(
      `INSERT INTO schedule_slots (id, subject_id, day_of_week, start_time, end_time, room, title, color)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [id, subjectId, day, start, end, room, title, color],
    );
  }

  const grades: [string, string, number | null, number | null, number | null][] = [
    ["g1", "calc-1", 7.0, 7.8, 7.4],
    ["g2", "redes", 8.5, 9.0, 8.8],
    ["g3", "algoritmos", 9.0, 8.5, 8.8],
    ["g4", "bd", 8.2, null, 8.2],
    ["g5", "es", 7.5, 8.0, 7.8],
  ];
  for (const [id, subjectId, a1, a2, avg] of grades) {
    await db.execute(
      `INSERT INTO grades (id, subject_id, assessment1, assessment2, average)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, subjectId, a1, a2, avg],
    );
  }

  const attendance: [string, string, number][] = [
    ["att-calc-1", "calc-1", 92],
    ["att-redes", "redes", 88],
    ["att-algoritmos", "algoritmos", 96],
    ["att-bd", "bd", 85],
    ["att-es", "es", 84],
  ];
  for (const [id, subjectId, percent] of attendance) {
    await db.execute(
      `INSERT INTO attendance (id, subject_id, percent, absences, total_classes)
       VALUES ($1, $2, $3, 0, 0)`,
      [id, subjectId, percent],
    );
  }

  const events: [string, string, string, string, string, string | null][] = [
    ["e1", "Entrega de lista", "2026-11-03", "pink", "entrega", "calc-1"],
    ["e2", "Revisão SQL", "2026-11-05", "mint", "outro", "bd"],
    ["e3", "Redes - trabalho", "2026-11-13", "mint", "entrega", "redes"],
    ["e4", "Prova Cálculo 1", "2026-11-18", "pink", "prova", "calc-1"],
    ["e5", "Seminário", "2026-11-20", "yellow", "outro", null],
    ["e6", "Quiz Algoritmos", "2026-11-24", "blue", "prova", "algoritmos"],
    ["e7", "Entrega do projeto", "2026-11-27", "lavender", "entrega", "algoritmos"],
  ];
  for (const [id, title, date, color, type, subjectId] of events) {
    await db.execute(
      `INSERT INTO calendar_events (id, title, date, color, type, subject_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, title, date, color, type, subjectId],
    );
  }

  const reminders: [string, string, string, string][] = [
    ["r1", "Revisar integrais para a prova", "2026-11-12T09:00:00", "pink"],
    ["r2", "Entregar trabalho de Redes", "2026-11-13T18:00:00", "mint"],
    ["r3", "Praticar consultas SQL", "2026-11-16T14:00:00", "yellow"],
    ["r4", "Prova de Cálculo 1", "2026-11-18T08:00:00", "lavender"],
  ];
  for (const [id, title, datetime, color] of reminders) {
    await db.execute(
      `INSERT INTO reminders (id, title, datetime, color, done) VALUES ($1, $2, $3, $4, 0)`,
      [id, title, datetime, color],
    );
  }

  await db.execute(
    `INSERT INTO focus_settings (id, duration_minutes, target_cycles, completed_cycles)
     VALUES ($1, $2, $3, $4)`,
    ["focus-1", 25, 4, 0],
  );

  const decks: [string, string, string, number][] = [
    ["deck-redes", "redes", "Redes de Computadores", 12],
    ["deck-calc", "calc-1", "Cálculo 1", 28],
    ["deck-algo", "algoritmos", "Algoritmos", 18],
    ["deck-bd", "bd", "Banco de Dados", 14],
  ];
  for (const [id, subjectId, name, cardCount] of decks) {
    await db.execute(
      `INSERT INTO flashcard_decks (id, subject_id, name, card_count) VALUES ($1, $2, $3, $4)`,
      [id, subjectId, name, cardCount],
    );
  }

  const cards: [string, string, string, string, string][] = [
    ["c1", "deck-redes", "O que diferencia TCP e UDP?", "TCP é orientado à conexão, confiável e ordenado; UDP é sem conexão, mais rápido e sem garantia de entrega.", "2026-11-11"],
    ["c2", "deck-redes", "O que é um endereço IP?", "Identificador lógico de um host em uma rede.", "2026-11-11"],
    ["c3", "deck-redes", "Para que serve o DNS?", "Traduz nomes de domínio em endereços IP.", "2026-11-12"],
    ["c4", "deck-redes", "O que é a camada de rede?", "Camada responsável pelo endereçamento lógico e pelo roteamento entre redes.", "2026-11-11"],
    ["c5", "deck-calc", "O que é uma integral indefinida?", "Família de primitivas F(x) cuja derivada é f(x), mais a constante C.", "2026-11-11"],
    ["c6", "deck-calc", "Qual a derivada de x²?", "2x", "2026-11-11"],
    ["c7", "deck-algo", "O que é uma lista encadeada?", "Estrutura onde cada nó guarda um valor e uma referência ao próximo nó.", "2026-11-11"],
    ["c8", "deck-bd", "Para que serve a chave primária?", "Identifica de forma única cada registro de uma tabela.", "2026-11-11"],
  ];
  for (const [id, deckId, question, answer, next] of cards) {
    await db.execute(
      `INSERT INTO flashcards
        (id, deck_id, question, answer, next_review_at, interval_days, ease_factor, repetitions, last_reviewed_at)
       VALUES ($1, $2, $3, $4, $5, 0, 2.5, 0, NULL)`,
      [id, deckId, question, answer, next],
    );
  }

  type TopicSeed = {
    id: string;
    subjectId: string;
    slug: string;
    title: string;
    tag: string;
    breadcrumb: string;
    question: string;
    definition: string;
    formula: string;
    example: string;
    attachments: [string, string, string, string][];
  };

  const topics: TopicSeed[] = [
    {
      id: "topic-integrais",
      subjectId: "calc-1",
      slug: "integrais",
      title: "Integrais indefinidas",
      tag: "✦ Conteúdo 01",
      breadcrumb: "Integrais",
      question: "O que é uma integral indefinida?",
      definition: "É uma família de funções primitivas F(x), cuja derivada é f(x).",
      formula: "\\int f(x)\\, dx = F(x) + C",
      example: "\\int 2x\\, dx = x^2 + C",
      attachments: [
        ["a1", "Roteiro semana 11.pdf", "pdf", "PDF · 2,4 MB"],
        ["a2", "Lista de exercícios.pdf", "pdf", "PDF · 1,2 MB"],
        ["a3", "Anotações da aula.md", "markdown", "Markdown · 18 KB"],
        ["a4", "Prova anterior.pdf", "pdf", "PDF · 3,1 MB"],
      ],
    },
    {
      id: "topic-rede",
      subjectId: "redes",
      slug: "camada-de-rede",
      title: "Camada de rede",
      tag: "✦ Conteúdo 02",
      breadcrumb: "Camada de rede",
      question: "Qual o papel da camada de rede?",
      definition: "Endereçar hosts logicamente e encaminhar pacotes entre redes distintas.",
      formula: "\\text{IP} = \\text{rede} + \\text{host}",
      example: "\\text{192.168.0.0/24}",
      attachments: [
        ["r1", "Slides camada de rede.pdf", "slide", "PDF · 4,1 MB"],
        ["r2", "RFC 791 (IPv4).pdf", "pdf", "PDF · 1,8 MB"],
        ["r3", "Mapa mental redes.md", "markdown", "Markdown · 12 KB"],
      ],
    },
    {
      id: "topic-listas",
      subjectId: "algoritmos",
      slug: "listas",
      title: "Listas e estruturas",
      tag: "✦ Conteúdo 03",
      breadcrumb: "Listas",
      question: "O que é uma lista encadeada?",
      definition: "Estrutura dinâmica em que cada nó aponta para o próximo elemento.",
      formula: "\\text{nó} = (\\text{valor}, \\text{próximo})",
      example: "\\text{head} \\rightarrow 1 \\rightarrow 2 \\rightarrow \\emptyset",
      attachments: [
        ["al1", "Lista de exercícios.py", "markdown", "Python · 8 KB"],
        ["al2", "Notas de aula.md", "markdown", "Markdown · 22 KB"],
      ],
    },
    {
      id: "topic-sql",
      subjectId: "bd",
      slug: "sql",
      title: "Consultas SQL",
      tag: "✦ Conteúdo 04",
      breadcrumb: "SQL",
      question: "Para que serve o SELECT?",
      definition: "Recupera dados de uma ou mais tabelas, com filtros e projeções.",
      formula: "\\text{SELECT colunas FROM tabela}",
      example: "\\text{SELECT nome FROM alunos WHERE media > 7}",
      attachments: [
        ["b1", "Cheat sheet SQL.pdf", "pdf", "PDF · 900 KB"],
        ["b2", "Modelo ER.pdf", "slide", "PDF · 2,0 MB"],
      ],
    },
    {
      id: "topic-git",
      subjectId: "es",
      slug: "git",
      title: "Fluxo com Git",
      tag: "✦ Conteúdo 05",
      breadcrumb: "Git",
      question: "O que é um commit?",
      definition: "Registro imutável de um conjunto de mudanças no repositório.",
      formula: "\\text{working} \\to \\text{staging} \\to \\text{commit}",
      example: "\\text{git commit -m \"mensagem\"}",
      attachments: [
        ["e1-att", "Guia Git básico.pdf", "pdf", "PDF · 1,1 MB"],
        ["e2-att", "Checklist de PR.md", "markdown", "Markdown · 6 KB"],
      ],
    },
  ];

  for (let ti = 0; ti < topics.length; ti++) {
    const t = topics[ti];
    await db.execute(
      `INSERT INTO content_topics (id, subject_id, slug, title, tag, breadcrumb, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [t.id, t.subjectId, t.slug, t.title, t.tag, t.breadcrumb, ti],
    );

    const blocks: [string, string, string, number][] = [
      [`${t.id}-q`, "question", t.question, 0],
      [`${t.id}-d`, "definition", t.definition, 1],
      [`${t.id}-f`, "formula", t.formula, 2],
      [`${t.id}-e`, "example", t.example, 3],
    ];
    for (const [id, kind, body, order] of blocks) {
      await db.execute(
        `INSERT INTO content_blocks (id, topic_id, kind, body, sort_order)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, t.id, kind, body, order],
      );
    }

    for (let ai = 0; ai < t.attachments.length; ai++) {
      const [id, name, kind, meta] = t.attachments[ai];
      await db.execute(
        `INSERT INTO attachments (id, topic_id, subject_id, name, kind, meta, path, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, NULL, $7)`,
        [id, t.id, t.subjectId, name, kind, meta, ai],
      );
    }
  }

  const now = new Date().toISOString();
  const snippets: [string, string, string, string, string, string][] = [
    ["f1", "algoritmos", "media.py", "python", PYTHON_SNIPPET, "lavender"],
    ["f2", "calc-1", "integrais.tex", "latex", "\\int_0^1 x^2 \\, dx", "pink"],
    ["f3", "bd", "consultas.sql", "sql", "SELECT * FROM alunos;", "mint"],
  ];
  for (const [id, subjectId, name, language, content, tint] of snippets) {
    await db.execute(
      `INSERT INTO lab_snippets (id, subject_id, name, language, content, tint, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, subjectId, name, language, content, tint, now],
    );
  }

  await db.execute(
    `INSERT INTO favorites (id, entity_type, entity_id, created_at)
     VALUES ($1, $2, $3, $4)`,
    ["fav-1", "subject", "calc-1", now],
  );
  await db.execute(
    `INSERT INTO favorites (id, entity_type, entity_id, created_at)
     VALUES ($1, $2, $3, $4)`,
    ["fav-2", "deck", "deck-redes", now],
  );

  await db.execute(
    `INSERT INTO app_settings (key, value) VALUES ($1, $2)`,
    ["locale", "pt-BR"],
  );
  await db.execute(
    `INSERT INTO app_settings (key, value) VALUES ($1, $2)`,
    ["seeded_at", now],
  );

  await db.execute(
    `INSERT INTO theme_prefs (id, mode, accent) VALUES ($1, $2, $3)`,
    ["default", "light", "bloom"],
  );

  return true;
}
