/**
 * Migração v1 — schema completo do Study Bloom.
 * CREATE TABLE IF NOT EXISTS: seguro reexecutar no boot.
 */

export const SCHEMA_VERSION = 1;

/**
 * Tabelas v1:
 * schema_migrations, semester, subjects, tasks, schedule_slots, grades,
 * attendance, reminders, calendar_events, focus_settings, flashcard_decks,
 * flashcards, content_topics, content_blocks, attachments, lab_snippets,
 * favorites, app_settings, theme_prefs
 *
 * Nota: services/settings.ts grava em app_settings (não em "settings").
 */
export const USER_DATA_TABLES = [
  "favorites",
  "attachments",
  "content_blocks",
  "content_topics",
  "flashcards",
  "flashcard_decks",
  "lab_snippets",
  "reminders",
  "calendar_events",
  "attendance",
  "grades",
  "schedule_slots",
  "tasks",
  "focus_settings",
  "subjects",
  "semester",
  "app_settings",
  "theme_prefs",
] as const;

export type UserDataTable = (typeof USER_DATA_TABLES)[number];

export const MIGRATION_V1_STATEMENTS: string[] = [
  `CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY NOT NULL,
    applied_at TEXT NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS semester (
    id TEXT PRIMARY KEY NOT NULL,
    label TEXT NOT NULL,
    course TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 0
  )`,

  `CREATE TABLE IF NOT EXISTS subjects (
    id TEXT PRIMARY KEY NOT NULL,
    semester_id TEXT,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    color TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT '',
    materials_count INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (semester_id) REFERENCES semester(id)
  )`,

  `CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    subject_id TEXT NOT NULL,
    status TEXT NOT NULL,
    tag TEXT NOT NULL DEFAULT '',
    due_date TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (subject_id) REFERENCES subjects(id)
  )`,

  `CREATE TABLE IF NOT EXISTS schedule_slots (
    id TEXT PRIMARY KEY NOT NULL,
    subject_id TEXT,
    day_of_week INTEGER NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT,
    room TEXT NOT NULL DEFAULT '',
    title TEXT NOT NULL DEFAULT '',
    color TEXT NOT NULL DEFAULT 'lavender',
    FOREIGN KEY (subject_id) REFERENCES subjects(id)
  )`,

  `CREATE TABLE IF NOT EXISTS grades (
    id TEXT PRIMARY KEY NOT NULL,
    subject_id TEXT NOT NULL UNIQUE,
    assessment1 REAL,
    assessment2 REAL,
    average REAL,
    FOREIGN KEY (subject_id) REFERENCES subjects(id)
  )`,

  `CREATE TABLE IF NOT EXISTS attendance (
    id TEXT PRIMARY KEY NOT NULL,
    subject_id TEXT NOT NULL UNIQUE,
    percent REAL NOT NULL DEFAULT 100,
    absences INTEGER NOT NULL DEFAULT 0,
    total_classes INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (subject_id) REFERENCES subjects(id)
  )`,

  `CREATE TABLE IF NOT EXISTS reminders (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    datetime TEXT NOT NULL,
    color TEXT NOT NULL,
    done INTEGER NOT NULL DEFAULT 0,
    task_id TEXT,
    event_id TEXT
  )`,

  `CREATE TABLE IF NOT EXISTS calendar_events (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    color TEXT NOT NULL,
    type TEXT NOT NULL,
    subject_id TEXT,
    alert_enabled INTEGER NOT NULL DEFAULT 0,
    alert_minutes_before INTEGER NOT NULL DEFAULT 1440,
    FOREIGN KEY (subject_id) REFERENCES subjects(id)
  )`,

  `CREATE TABLE IF NOT EXISTS focus_settings (
    id TEXT PRIMARY KEY NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 25,
    target_cycles INTEGER NOT NULL DEFAULT 4,
    completed_cycles INTEGER NOT NULL DEFAULT 0
  )`,

  `CREATE TABLE IF NOT EXISTS flashcard_decks (
    id TEXT PRIMARY KEY NOT NULL,
    subject_id TEXT NOT NULL,
    name TEXT NOT NULL,
    card_count INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (subject_id) REFERENCES subjects(id)
  )`,

  `CREATE TABLE IF NOT EXISTS flashcards (
    id TEXT PRIMARY KEY NOT NULL,
    deck_id TEXT NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    next_review_at TEXT NOT NULL,
    interval_days INTEGER NOT NULL DEFAULT 0,
    ease_factor REAL NOT NULL DEFAULT 2.5,
    repetitions INTEGER NOT NULL DEFAULT 0,
    last_reviewed_at TEXT,
    FOREIGN KEY (deck_id) REFERENCES flashcard_decks(id)
  )`,

  `CREATE TABLE IF NOT EXISTS content_topics (
    id TEXT PRIMARY KEY NOT NULL,
    subject_id TEXT NOT NULL,
    slug TEXT NOT NULL,
    title TEXT NOT NULL,
    tag TEXT NOT NULL DEFAULT '',
    breadcrumb TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    UNIQUE (subject_id, slug),
    FOREIGN KEY (subject_id) REFERENCES subjects(id)
  )`,

  `CREATE TABLE IF NOT EXISTS content_blocks (
    id TEXT PRIMARY KEY NOT NULL,
    topic_id TEXT NOT NULL,
    kind TEXT NOT NULL,
    body TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (topic_id) REFERENCES content_topics(id)
  )`,

  `CREATE TABLE IF NOT EXISTS attachments (
    id TEXT PRIMARY KEY NOT NULL,
    topic_id TEXT,
    subject_id TEXT,
    name TEXT NOT NULL,
    kind TEXT NOT NULL,
    meta TEXT NOT NULL DEFAULT '',
    path TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (topic_id) REFERENCES content_topics(id),
    FOREIGN KEY (subject_id) REFERENCES subjects(id)
  )`,

  `CREATE TABLE IF NOT EXISTS lab_snippets (
    id TEXT PRIMARY KEY NOT NULL,
    subject_id TEXT,
    name TEXT NOT NULL,
    language TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    tint TEXT,
    updated_at TEXT,
    FOREIGN KEY (subject_id) REFERENCES subjects(id)
  )`,

  `CREATE TABLE IF NOT EXISTS favorites (
    id TEXT PRIMARY KEY NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    UNIQUE (entity_type, entity_id)
  )`,

  `CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS theme_prefs (
    id TEXT PRIMARY KEY NOT NULL DEFAULT 'default',
    mode TEXT NOT NULL DEFAULT 'light',
    accent TEXT NOT NULL DEFAULT 'bloom'
  )`,
];
