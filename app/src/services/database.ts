/**
 * Fundação SQLite (Tauri plugin-sql)
 * ----------------------------------
 * Arquivo: study-bloom.db em AppData (NÃO na pasta de instalação).
 * Windows: %APPDATA%\com.studybloom.desktop\study-bloom.db
 *
 * Docs: https://v2.tauri.app/plugin/sql/
 *
 * ---------------------------------------------------------------------------
 * CRUD API — contrato para outros agents (substituir MOCK_* nos services)
 * ---------------------------------------------------------------------------
 * Sempre: `const db = await getDb()` — ou `query` / `execute` abaixo.
 * No browser Vite puro, getDb lança; services mantêm MOCK até `dev:tauri`.
 *
 * semester
 *   SELECT * FROM semester WHERE is_active = 1 LIMIT 1
 *   UPDATE label, course, is_active
 *
 * subjects  → services/subjects.ts
 *   list ORDER BY sort_order; get by id; INSERT/UPDATE/DELETE
 *   map: materials_count → materialsCount
 *
 * tasks  → services/tasks.ts
 *   list / WHERE status; move = UPDATE status; due_date → dueDate
 *
 * schedule_slots  → services/schedule.ts
 *   ORDER BY day_of_week, start_time; color + title denormalizados
 *
 * grades + attendance  → services/grades.ts
 *   JOIN subjects; upsert assessments; attendance.percent / absences
 *
 * reminders  → services/reminders.ts
 *   ORDER BY datetime; done 0|1
 *
 * calendar_events  → services/calendar.ts
 *   WHERE date LIKE 'YYYY-MM%'; type prova|entrega|aula|outro
 *
 * focus_settings  → services/reminders.ts (Pomodoro)
 *   duration_minutes, target_cycles, completed_cycles
 *
 * flashcard_decks + flashcards  → services/flashcards.ts
 *   review: next_review_at, ease_factor, interval_days, repetitions
 *   manter card_count ao criar/apagar cards
 *
 * content_topics + content_blocks + attachments  → services/content.ts
 *   topic (subject_id, slug); blocks kind: question|definition|formula|example
 *   attachments.meta = texto display (ex. "PDF · 2,4 MB"); path opcional
 *
 * lab_snippets  → services/laboratory.ts
 *   language + content; tint / updated_at
 *
 * favorites
 *   UNIQUE(entity_type, entity_id); types: subject|topic|deck|snippet|event
 *
 * app_settings + theme_prefs  → services/settings.ts
 *   app_settings: KV genérico (getSetting/setSetting)
 *   theme_prefs: mode light|dark|system + accent
 * ---------------------------------------------------------------------------
 */

import Database from "@tauri-apps/plugin-sql";
import type { QueryResult } from "@tauri-apps/plugin-sql";
import {
  MIGRATION_V1_STATEMENTS,
  SCHEMA_VERSION,
} from "./db/migrations";
import { seedIfEmpty } from "./db/seed";

const DB_URL = "sqlite:study-bloom.db";

let db: Database | null = null;
let initPromise: Promise<Database | null> | null = null;

function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

/** Abre (ou reutiliza) o banco local study-bloom.db */
export async function getDb(): Promise<Database> {
  if (db) return db;

  if (!isTauriRuntime()) {
    throw new Error(
      "SQLite só disponível no runtime Tauri. Use npm run dev:tauri.",
    );
  }

  db = await Database.load(DB_URL);
  return db;
}

/** Alias legado / docs */
export const getDatabase = getDb;

/** SELECT tipado — placeholders $1, $2, ... */
export async function query<T>(
  sql: string,
  bindValues: unknown[] = [],
): Promise<T[]> {
  const database = await getDb();
  return database.select<T[]>(sql, bindValues);
}

/** INSERT / UPDATE / DELETE / DDL */
export async function execute(
  sql: string,
  bindValues: unknown[] = [],
): Promise<QueryResult> {
  const database = await getDb();
  return database.execute(sql, bindValues);
}

async function applyMigrations(database: Database): Promise<void> {
  for (const statement of MIGRATION_V1_STATEMENTS) {
    await database.execute(statement);
  }

  const applied = await database.select<{ version: number }[]>(
    "SELECT version FROM schema_migrations WHERE version = $1",
    [SCHEMA_VERSION],
  );

  if (applied.length === 0) {
    await database.execute(
      "INSERT INTO schema_migrations (version, applied_at) VALUES ($1, $2)",
      [SCHEMA_VERSION, new Date().toISOString()],
    );
  }
}

/**
 * Boot: abre DB → migrations → seed se vazio.
 * Idempotente. No browser (Vite), no-op e retorna null.
 */
export async function initDatabase(): Promise<Database | null> {
  if (!isTauriRuntime()) {
    console.info("[Study Bloom] Browser: SQLite adiado (só no Tauri).");
    return null;
  }

  if (!initPromise) {
    initPromise = (async () => {
      const database = await getDb();
      await applyMigrations(database);
      const seeded = await seedIfEmpty(database);
      if (seeded) {
        console.info("[Study Bloom] Seed inicial aplicado (banco vazio).");
      }
      return database;
    })().catch((err) => {
      initPromise = null;
      throw err;
    });
  }

  return initPromise;
}

/** Alias docs antigas — chama initDatabase. */
export async function runMigrations(): Promise<void> {
  await initDatabase();
}

export {
  SCHEMA_VERSION,
  USER_DATA_TABLES,
  MIGRATION_V1_STATEMENTS,
} from "./db/migrations";
export type { UserDataTable } from "./db/migrations";
export { isDatabaseEmpty, seedIfEmpty } from "./db/seed";
export type { QueryResult };
