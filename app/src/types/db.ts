/**
 * Tipos das linhas SQLite (snake_case = colunas do banco).
 * Services de domínio mapeiam para os tipos camelCase em ./index.ts.
 */

export type SemesterRow = {
  id: string;
  label: string;
  course: string;
  is_active: number;
};

export type SubjectRow = {
  id: string;
  semester_id: string | null;
  name: string;
  description: string;
  color: string;
  icon: string;
  materials_count: number;
  sort_order: number;
};

export type TaskRow = {
  id: string;
  title: string;
  subject_id: string;
  status: string;
  tag: string;
  due_date: string | null;
  sort_order: number;
};

export type ScheduleSlotRow = {
  id: string;
  subject_id: string | null;
  day_of_week: number;
  start_time: string;
  end_time: string | null;
  room: string;
  title: string;
  color: string;
};

export type GradeRowDb = {
  id: string;
  subject_id: string;
  assessment1: number | null;
  assessment2: number | null;
  average: number | null;
};

export type AttendanceRow = {
  id: string;
  subject_id: string;
  percent: number;
  absences: number;
  total_classes: number;
};

export type CalendarEventRow = {
  id: string;
  title: string;
  date: string;
  color: string;
  type: string;
  subject_id: string | null;
  alert_enabled: number;
  alert_minutes_before: number;
};

export type ReminderRow = {
  id: string;
  title: string;
  datetime: string;
  color: string;
  done: number;
  task_id: string | null;
  event_id: string | null;
};

export type FocusSettingsRow = {
  id: string;
  duration_minutes: number;
  target_cycles: number;
  completed_cycles: number;
};

export type FlashcardDeckRow = {
  id: string;
  subject_id: string;
  name: string;
  card_count: number;
};

/** Campos SRS (SM-2): interval_days, ease_factor, repetitions, next_review_at */
export type FlashcardRow = {
  id: string;
  deck_id: string;
  question: string;
  answer: string;
  next_review_at: string;
  interval_days: number;
  ease_factor: number;
  repetitions: number;
  last_reviewed_at: string | null;
};

export type ContentTopicRow = {
  id: string;
  subject_id: string;
  slug: string;
  title: string;
  tag: string;
  breadcrumb: string;
  sort_order: number;
};

export type ContentBlockRow = {
  id: string;
  topic_id: string;
  kind: string;
  body: string;
  sort_order: number;
};

export type AttachmentRow = {
  id: string;
  topic_id: string | null;
  subject_id: string | null;
  name: string;
  kind: string;
  meta: string;
  path: string | null;
  sort_order: number;
};

export type LabSnippetRow = {
  id: string;
  subject_id: string | null;
  name: string;
  language: string;
  content: string;
  tint: string | null;
  updated_at: string | null;
};

export type FavoriteRow = {
  id: string;
  entity_type: string;
  entity_id: string;
  created_at: string;
};

/** Tabela física: app_settings */
export type AppSettingRow = {
  key: string;
  value: string;
};

export type ThemePrefsRow = {
  id: string;
  mode: string;
  accent: string;
};

/** @deprecated use GradeRowDb — evita colisão com services/grades GradeRow */
export type GradeRow = GradeRowDb;
