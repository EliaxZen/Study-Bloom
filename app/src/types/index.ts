/**
 * Tipos do domínio Study Bloom
 * -------------------------------
 * Aqui ficam as "formas" dos dados (como um Model no MVC).
 * As páginas usam esses tipos; o banco SQLite vai gravar objetos parecidos.
 */

/** Semestre atual da aluna */
export type Semester = {
  id: string;
  label: string; // ex: "2026.2"
  course: string; // ex: "Ciência da Computação"
};

/** Cores pastel usadas no Figma para disciplinas */
export type SubjectColor =
  | "pink"
  | "mint"
  | "lavender"
  | "yellow"
  | "blue";

/** Disciplina / matéria */
export type Subject = {
  id: string;
  name: string;
  description: string;
  color: SubjectColor;
  icon: string; // símbolo simples: "∫", "</>", etc.
  materialsCount: number;
};

/** Colunas do Kanban */
export type TaskStatus = "todo" | "doing" | "review" | "done";

export type Task = {
  id: string;
  title: string;
  subjectId: string;
  status: TaskStatus;
  tag: string; // ex: "Alta prioridade"
  dueDate?: string; // ISO date opcional
};

/** Bloco na grade horária */
export type ScheduleBlock = {
  id: string;
  subjectId: string;
  dayOfWeek: 1 | 2 | 3 | 4 | 5 | 6 | 7; // 1 = segunda
  startTime: string; // "08:00"
  endTime: string;
  room: string;
};

/** Lembrete */
export type Reminder = {
  id: string;
  title: string;
  datetime: string; // ISO
  color: SubjectColor;
};

/** Sessão de foco (Pomodoro) */
export type FocusSession = {
  id: string;
  durationMinutes: number; // padrão 25
  completedCycles: number;
  targetCycles: number;
};

/** Nota / avaliação */
export type GradeEntry = {
  id: string;
  subjectId: string;
  assessment1?: number;
  assessment2?: number;
  average?: number;
  attendancePercent: number;
};

/** Evento do calendário acadêmico */
export type CalendarEvent = {
  id: string;
  title: string;
  date: string; // ISO date
  color: SubjectColor;
  type: "prova" | "entrega" | "aula" | "outro";
};

/** Flashcard (SRS) */
export type Flashcard = {
  id: string;
  deckId: string;
  question: string;
  answer: string;
  nextReviewAt: string;
};

export type FlashcardDeck = {
  id: string;
  subjectId: string;
  name: string;
  cardCount: number;
};

/** Arquivo / snippet do laboratório */
export type StudyFile = {
  id: string;
  subjectId: string;
  name: string;
  language: "python" | "c" | "javascript" | "sql" | "latex" | "markdown" | "other";
  content: string;
};
