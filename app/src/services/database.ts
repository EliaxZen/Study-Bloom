/**
 * Camada de banco (SQLite via Tauri)
 * ----------------------------------
 * Por enquanto só prepara a conexão.
 * No próximo passo criamos as tabelas e o CRUD.
 *
 * Docs do plugin: https://v2.tauri.app/plugin/sql/
 */

import Database from "@tauri-apps/plugin-sql";

let db: Database | null = null;

/** Abre (ou reutiliza) o banco local study-bloom.db */
export async function getDatabase(): Promise<Database> {
  if (db) return db;

  // sqlite:nome.db → AppData do usuário (NÃO na pasta de instalação).
  // Windows: %APPDATA%\com.studybloom.desktop\study-bloom.db
  // Assim atualizar/reinstalar o .exe preserva notas e tarefas.
  db = await Database.load("sqlite:study-bloom.db");
  return db;
}

/** Roda a migração inicial (tabelas). Chamaremos no boot do app. */
export async function runMigrations(): Promise<void> {
  const database = await getDatabase();

  // Exemplos iniciais — expandimos conforme as telas forem implementadas
  await database.execute(`
    CREATE TABLE IF NOT EXISTS semester (
      id TEXT PRIMARY KEY NOT NULL,
      label TEXT NOT NULL,
      course TEXT NOT NULL
    );
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      color TEXT NOT NULL,
      icon TEXT NOT NULL,
      materials_count INTEGER NOT NULL DEFAULT 0
    );
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      status TEXT NOT NULL,
      tag TEXT NOT NULL,
      due_date TEXT
    );
  `);
}
