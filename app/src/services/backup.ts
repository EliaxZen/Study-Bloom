/**
 * Backup export/import (JSON; CSV opcional)
 * ----------------------------------------
 * Tauri: tabelas SQLite + prefs do cliente (Zustand).
 * Web (Vite): dump das chaves localStorage study-bloom* + prefs.
 * Import: merge ou replace — replace SEMPRE exige confirmação.
 */

import { z } from "zod";
import {
  SCHEMA_VERSION,
  USER_DATA_TABLES,
} from "./db/migrations";
import { getDb, runMigrations } from "./database";
import { useSettingsStore } from "../stores/settingsStore";
import { useSemesterStore } from "../stores/semesterStore";
import { useFocusStore } from "../stores/focusStore";
import { useThemeStore } from "../stores/themeStore";
import { useFavoritesStore } from "../stores/favoritesStore";
import type { ThemeMode } from "./themePersistence";
import type { Semester } from "../types";

export { USER_DATA_TABLES } from "./db/migrations";

export const BACKUP_FORMAT = "study-bloom-backup" as const;
export const BACKUP_FILE_VERSION = 1;

/** Chaves localStorage cobertas no backup web (e limpas no replace). */
export const WEB_BACKUP_STORAGE_KEYS = [
  "study-bloom.tasks.v1",
  "study-bloom.subjects.v1",
  "study-bloom-schedule",
  "study-bloom-calendar-events",
  "study-bloom-reminders",
  "study-bloom-grades",
  "study-bloom-flashcards-v1",
  "study-bloom-content-topics",
  "study-bloom-content-attachments",
  "study-bloom:lab-files",
  "study-bloom:lab-draft",
  "study-bloom-delivery-checklist",
  "study-bloom-theme-prefs",
  "study-bloom:theme.accent",
  "study-bloom-settings",
  "study-bloom-semester",
  "study-bloom-focus",
  "study-bloom-favorites",
  "study-bloom-notified",
] as const;

/** localStorage de serviços → tabela SQLite (import web a partir de backup Tauri). */
const WEB_TABLE_TO_STORAGE: Partial<
  Record<(typeof USER_DATA_TABLES)[number], string>
> = {
  tasks: "study-bloom.tasks.v1",
  subjects: "study-bloom.subjects.v1",
  schedule_slots: "study-bloom-schedule",
  calendar_events: "study-bloom-calendar-events",
  reminders: "study-bloom-reminders",
  grades: "study-bloom-grades",
  lab_snippets: "study-bloom:lab-files",
  content_topics: "study-bloom-content-topics",
};

export type ImportMode = "merge" | "replace";

export type BackupClientPrefs = {
  settings?: {
    gradeWeights?: { assessment1: number; assessment2: number };
    notifications?: {
      reminders: boolean;
      focusAlerts: boolean;
      calendarAlerts: boolean;
      minutesBefore: number;
    };
    theme?: ThemeMode;
  };
  semester?: Semester;
  focus?: {
    durationMinutes: number;
    breakMinutes: number;
    targetCycles: number;
    alertMode: "sound" | "notify" | "both";
    completedCycles: number;
    secondsLeft: number;
    phase: "focus" | "break";
  };
};

export type BackupPayload = {
  format: typeof BACKUP_FORMAT;
  version: number;
  exportedAt: string;
  schemaVersion: number;
  tables: Record<string, Record<string, unknown>[]>;
  client?: BackupClientPrefs;
  /** Dump web — strings cruas do localStorage */
  webLocalStorage?: Record<string, string>;
};

const BackupSchema = z.object({
  format: z.literal(BACKUP_FORMAT),
  version: z.number().int().positive(),
  exportedAt: z.string().min(1),
  schemaVersion: z.number().optional(),
  tables: z.record(z.string(), z.array(z.record(z.string(), z.any()))),
  client: z
    .object({
      settings: z.any().optional(),
      semester: z.any().optional(),
      focus: z.any().optional(),
    })
    .optional(),
  webLocalStorage: z.record(z.string(), z.string()).optional(),
});

function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

function stampDefaultName(ext: "json" | "csv"): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `study-bloom-backup-${y}${m}${day}.${ext}`;
}

function collectClientPrefs(): BackupClientPrefs {
  const settings = useSettingsStore.getState();
  const semester = useSemesterStore.getState().semester;
  const focus = useFocusStore.getState();
  const themeMode = useThemeStore.getState().mode;
  return {
    settings: {
      gradeWeights: settings.gradeWeights,
      notifications: settings.notifications,
      theme: themeMode,
    },
    semester,
    focus: {
      durationMinutes: focus.durationMinutes,
      breakMinutes: focus.breakMinutes,
      targetCycles: focus.targetCycles,
      alertMode: focus.alertMode,
      completedCycles: focus.completedCycles,
      secondsLeft: focus.secondsLeft,
      phase: focus.phase,
    },
  };
}

function applyClientPrefs(client: BackupClientPrefs | undefined): void {
  if (!client) return;

  if (client.settings) {
    const s = useSettingsStore.getState();
    if (client.settings.gradeWeights) {
      s.setGradeWeights(client.settings.gradeWeights);
    }
    if (client.settings.notifications) {
      s.setNotifications(client.settings.notifications);
    }
    if (client.settings.theme) {
      void useThemeStore.getState().setMode(client.settings.theme);
    }
  }

  if (client.semester) {
    useSemesterStore.getState().setSemester(client.semester);
  }

  if (client.focus) {
    useFocusStore.setState({
      durationMinutes: client.focus.durationMinutes,
      breakMinutes: client.focus.breakMinutes ?? 5,
      targetCycles: client.focus.targetCycles,
      alertMode: client.focus.alertMode ?? "both",
      completedCycles: client.focus.completedCycles,
      secondsLeft: client.focus.secondsLeft,
      phase: client.focus.phase ?? "focus",
      running: false,
    });
  }
}

async function rehydrateClientStores(): Promise<void> {
  await Promise.all([
    useSettingsStore.persist.rehydrate(),
    useSemesterStore.persist.rehydrate(),
    useFocusStore.persist.rehydrate(),
    useFavoritesStore.persist.rehydrate(),
  ]);
}

function collectWebLocalStorage(): Record<string, string> {
  const out: Record<string, string> = {};
  if (typeof localStorage === "undefined") return out;

  for (const key of WEB_BACKUP_STORAGE_KEYS) {
    try {
      const value = localStorage.getItem(key);
      if (value != null) out[key] = value;
    } catch {
      // ignore
    }
  }

  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith("study-bloom")) continue;
      if (key in out) continue;
      const value = localStorage.getItem(key);
      if (value != null) out[key] = value;
    }
  } catch {
    // ignore
  }

  return out;
}

function clearWebBackupStorage(): void {
  if (typeof localStorage === "undefined") return;
  const keys = new Set<string>([...WEB_BACKUP_STORAGE_KEYS]);
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key.startsWith("study-bloom")) keys.add(key);
    }
  } catch {
    // ignore
  }
  for (const key of keys) {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }
}

function writeWebLocalStorage(dump: Record<string, string> | undefined): number {
  if (!dump || typeof localStorage === "undefined") return 0;
  let wrote = 0;
  for (const [key, value] of Object.entries(dump)) {
    if (!key.startsWith("study-bloom")) continue;
    if (typeof value !== "string") continue;
    try {
      localStorage.setItem(key, value);
      wrote += 1;
    } catch {
      // ignore
    }
  }
  return wrote;
}

/** Espelha linhas de tabelas SQLite nas chaves web conhecidas (backup desktop → web). */
function applySqliteTablesToWeb(tables: BackupPayload["tables"]): number {
  if (typeof localStorage === "undefined") return 0;
  let wrote = 0;

  for (const [table, storageKey] of Object.entries(WEB_TABLE_TO_STORAGE)) {
    const rows = tables[table];
    if (!rows || !Array.isArray(rows)) continue;
    try {
      localStorage.setItem(storageKey, JSON.stringify(rows));
      wrote += rows.length;
    } catch {
      // ignore
    }
  }

  const decks = tables.flashcard_decks;
  const cards = tables.flashcards;
  if ((decks && decks.length > 0) || (cards && cards.length > 0)) {
    let streakDays = 0;
    let lastStudyDate: string | null = null;
    try {
      const prev = localStorage.getItem("study-bloom-flashcards-v1");
      if (prev) {
        const parsed = JSON.parse(prev) as {
          streakDays?: number;
          lastStudyDate?: string | null;
        };
        streakDays = parsed.streakDays ?? 0;
        lastStudyDate = parsed.lastStudyDate ?? null;
      }
    } catch {
      // ignore
    }
    try {
      localStorage.setItem(
        "study-bloom-flashcards-v1",
        JSON.stringify({
          decks: decks ?? [],
          cards: cards ?? [],
          streakDays,
          lastStudyDate,
        }),
      );
      wrote += (decks?.length ?? 0) + (cards?.length ?? 0);
    } catch {
      // ignore
    }
  }

  const topics = tables.content_topics;
  const blocks = tables.content_blocks;
  if (topics && topics.length > 0) {
    const byTopic = new Map<string, Record<string, unknown>[]>();
    for (const block of blocks ?? []) {
      const topicId = String(block.topic_id ?? block.topicId ?? "");
      if (!topicId) continue;
      const list = byTopic.get(topicId) ?? [];
      list.push(block);
      byTopic.set(topicId, list);
    }
    const nested = topics.map((topic) => {
      const id = String(topic.id ?? "");
      const topicBlocks = (byTopic.get(id) ?? []).map((b, index) => ({
        id: String(b.id ?? `blk-${index}`),
        kind: String(b.kind ?? "text"),
        body: String(b.body ?? b.content ?? ""),
        sortOrder: Number(b.sort_order ?? b.sortOrder ?? index),
      }));
      return {
        id,
        subjectId: String(topic.subject_id ?? topic.subjectId ?? ""),
        slug: String(topic.slug ?? ""),
        title: String(topic.title ?? ""),
        tag: String(topic.tag ?? ""),
        sortOrder: Number(topic.sort_order ?? topic.sortOrder ?? 0),
        blocks: topicBlocks,
      };
    });
    try {
      localStorage.setItem(
        "study-bloom-content-topics",
        JSON.stringify(nested),
      );
      wrote += nested.length;
    } catch {
      // ignore
    }
  }

  const attachments = tables.attachments;
  if (attachments && attachments.length > 0) {
    const grouped: Record<string, unknown[]> = {};
    for (const row of attachments) {
      const topicKey = String(
        row.topic_key ?? row.topicKey ?? row.content_topic_id ?? "",
      );
      if (!topicKey) continue;
      if (!grouped[topicKey]) grouped[topicKey] = [];
      grouped[topicKey].push(row);
    }
    try {
      localStorage.setItem(
        "study-bloom-content-attachments",
        JSON.stringify(grouped),
      );
      wrote += attachments.length;
    } catch {
      // ignore
    }
  }

  return wrote;
}

async function tableExists(
  db: Awaited<ReturnType<typeof getDb>>,
  name: string,
): Promise<boolean> {
  const rows = await db.select<{ name: string }[]>(
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name = $1`,
    [name],
  );
  return rows.length > 0;
}

function emptyTables(): BackupPayload["tables"] {
  const tables: BackupPayload["tables"] = {};
  for (const name of USER_DATA_TABLES) {
    tables[name] = [];
  }
  return tables;
}

/** Monta o payload completo a partir do SQLite (Tauri) ou localStorage (web). */
export async function buildBackupPayload(): Promise<BackupPayload> {
  if (!isTauriRuntime()) {
    return {
      format: BACKUP_FORMAT,
      version: BACKUP_FILE_VERSION,
      exportedAt: new Date().toISOString(),
      schemaVersion: SCHEMA_VERSION,
      tables: emptyTables(),
      client: collectClientPrefs(),
      webLocalStorage: collectWebLocalStorage(),
    };
  }

  await runMigrations();
  const db = await getDb();
  const tables: BackupPayload["tables"] = {};

  for (const name of USER_DATA_TABLES) {
    if (!(await tableExists(db, name))) {
      tables[name] = [];
      continue;
    }
    tables[name] = await db.select<Record<string, unknown>[]>(
      `SELECT * FROM "${name}"`,
    );
  }

  return {
    format: BACKUP_FORMAT,
    version: BACKUP_FILE_VERSION,
    exportedAt: new Date().toISOString(),
    schemaVersion: SCHEMA_VERSION,
    tables,
    client: collectClientPrefs(),
  };
}

/** Aceita `settings` legado → `app_settings`. */
function normalizeBackupTables(
  tables: Record<string, Record<string, unknown>[]>,
): Record<string, Record<string, unknown>[]> {
  const next = { ...tables };
  if (next.settings && !next.app_settings) {
    next.app_settings = next.settings;
  }
  delete next.settings;
  return next;
}

export function parseBackupJson(raw: string): BackupPayload {
  const trimmed = raw.replace(/^\uFEFF/, "").trim();
  if (!trimmed) {
    throw new Error("Arquivo JSON vazio.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    throw new Error("Arquivo JSON inválido.");
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(
      "Backup não reconhecido — espere um objeto study-bloom-backup.",
    );
  }

  const result = BackupSchema.safeParse(parsed);
  if (!result.success) {
    const first = result.error.issues[0];
    const where = first?.path?.length ? ` (${first.path.join(".")})` : "";
    throw new Error(
      `Backup não reconhecido${where} — espere format study-bloom-backup.`,
    );
  }

  const data = result.data;
  return {
    format: data.format,
    version: data.version,
    exportedAt: data.exportedAt,
    schemaVersion: data.schemaVersion ?? SCHEMA_VERSION,
    tables: normalizeBackupTables(data.tables),
    client: data.client as BackupClientPrefs | undefined,
    webLocalStorage: data.webLocalStorage,
  };
}

function quoteCsv(value: unknown): string {
  const s =
    value === null || value === undefined
      ? ""
      : typeof value === "string"
        ? value
        : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** CSV multi-seção (opcional): #table + header + rows. */
export function backupToCsv(payload: BackupPayload): string {
  const parts: string[] = [
    `# study-bloom-backup v${payload.version}`,
    `# exportedAt ${payload.exportedAt}`,
  ];

  for (const name of USER_DATA_TABLES) {
    const rows = payload.tables[name] ?? [];
    parts.push("");
    parts.push(`#table ${name}`);
    if (rows.length === 0) {
      parts.push("# (vazio)");
      continue;
    }
    const cols = Object.keys(rows[0]);
    parts.push(cols.map(quoteCsv).join(","));
    for (const row of rows) {
      parts.push(cols.map((c) => quoteCsv(row[c])).join(","));
    }
  }

  return `${parts.join("\n")}\n`;
}

async function upsertRow(
  db: Awaited<ReturnType<typeof getDb>>,
  table: string,
  row: Record<string, unknown>,
): Promise<void> {
  const cols = Object.keys(row);
  if (cols.length === 0) return;
  const placeholders = cols.map((_, i) => `$${i + 1}`).join(", ");
  const sql = `INSERT OR REPLACE INTO "${table}" (${cols.map((c) => `"${c}"`).join(", ")}) VALUES (${placeholders})`;
  await db.execute(
    sql,
    cols.map((c) => row[c]),
  );
}

async function wipeUserTables(
  db: Awaited<ReturnType<typeof getDb>>,
): Promise<void> {
  await db.execute("PRAGMA foreign_keys = OFF");
  try {
    for (const name of USER_DATA_TABLES) {
      if (await tableExists(db, name)) {
        await db.execute(`DELETE FROM "${name}"`);
      }
    }
  } finally {
    await db.execute("PRAGMA foreign_keys = ON");
  }
}

/**
 * Confirmação obrigatória antes de apagar dados (Tauri ask ou window.confirm).
 */
export async function confirmReplaceBackup(): Promise<boolean> {
  const message =
    "Isso apaga TODOS os dados atuais do Study Bloom e substitui pelo backup.\n\nTem certeza?";

  if (isTauriRuntime()) {
    const { ask } = await import("@tauri-apps/plugin-dialog");
    return ask(message, {
      title: "Substituir dados",
      kind: "warning",
      okLabel: "Substituir tudo",
      cancelLabel: "Cancelar",
    });
  }

  if (typeof window === "undefined" || typeof window.confirm !== "function") {
    return false;
  }
  return window.confirm(message);
}

/**
 * Aplica backup no SQLite (Tauri) ou localStorage (web).
 * replace: apaga dados de usuário antes — chame só após confirmReplaceBackup().
 */
export async function applyBackupPayload(
  payload: BackupPayload,
  mode: ImportMode,
): Promise<{ tables: number; rows: number }> {
  if (!isTauriRuntime()) {
    if (mode === "replace") {
      clearWebBackupStorage();
    }

    let rows = writeWebLocalStorage(payload.webLocalStorage);
    if (
      !payload.webLocalStorage ||
      Object.keys(payload.webLocalStorage).length === 0
    ) {
      rows += applySqliteTablesToWeb(payload.tables);
    }

    await rehydrateClientStores();
    applyClientPrefs(payload.client);

    const tableCount = Object.values(payload.tables).filter(
      (list) => list && list.length > 0,
    ).length;
    return {
      tables: tableCount || (payload.webLocalStorage ? 1 : 0),
      rows,
    };
  }

  await runMigrations();
  const db = await getDb();

  if (mode === "replace") {
    await wipeUserTables(db);
  }

  let tables = 0;
  let rows = 0;
  const insertOrder = [...USER_DATA_TABLES].reverse();

  for (const name of insertOrder) {
    const list = payload.tables[name];
    if (!list || list.length === 0) continue;
    if (!(await tableExists(db, name))) continue;
    tables += 1;
    for (const row of list) {
      await upsertRow(db, name, row);
      rows += 1;
    }
  }

  applyClientPrefs(payload.client as BackupClientPrefs | undefined);
  return { tables, rows };
}

export type BackupDialogResult =
  | { ok: true; path: string; rows: number; tables: number }
  | { ok: false; cancelled: true }
  | { ok: false; cancelled: false; error: string };

function downloadTextFile(
  filename: string,
  contents: string,
  mime: string,
): void {
  const blob = new Blob([contents], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function pickTextFile(
  accept: string,
): Promise<
  { cancelled: true } | { cancelled: false; name: string; text: string }
> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.style.display = "none";

    let settled = false;
    const finish = (
      result:
        | { cancelled: true }
        | { cancelled: false; name: string; text: string },
    ) => {
      if (settled) return;
      settled = true;
      window.removeEventListener("focus", onWindowFocus);
      input.remove();
      resolve(result);
    };

    input.addEventListener("change", () => {
      const file = input.files?.[0];
      if (!file) {
        finish({ cancelled: true });
        return;
      }
      void file.text().then(
        (text) => finish({ cancelled: false, name: file.name, text }),
        () => finish({ cancelled: true }),
      );
    });

    const onWindowFocus = () => {
      window.setTimeout(() => {
        if (!settled && !input.files?.length) {
          finish({ cancelled: true });
        }
      }, 400);
    };

    document.body.appendChild(input);
    window.addEventListener("focus", onWindowFocus);
    input.click();
  });
}

function countPayloadRows(payload: BackupPayload): number {
  const tableRows = Object.values(payload.tables).reduce(
    (n, t) => n + t.length,
    0,
  );
  if (tableRows > 0) return tableRows;
  return payload.webLocalStorage
    ? Object.keys(payload.webLocalStorage).length
    : 0;
}

function countPayloadTables(payload: BackupPayload): number {
  const filled = Object.values(payload.tables).filter((t) => t.length > 0)
    .length;
  if (filled > 0) return Object.keys(payload.tables).length;
  if (
    payload.webLocalStorage &&
    Object.keys(payload.webLocalStorage).length > 0
  ) {
    return Object.keys(payload.webLocalStorage).length;
  }
  return Object.keys(payload.tables).length;
}

/** Diálogo Salvar → escreve JSON (Tauri) ou download no navegador. */
export async function exportBackupJsonWithDialog(): Promise<BackupDialogResult> {
  try {
    const payload = await buildBackupPayload();
    const body = JSON.stringify(payload, null, 2);
    const rows = countPayloadRows(payload);
    const tables = countPayloadTables(payload);

    if (isTauriRuntime()) {
      const { save } = await import("@tauri-apps/plugin-dialog");
      const { writeTextFile } = await import("@tauri-apps/plugin-fs");
      const path = await save({
        title: "Exportar backup Study Bloom",
        defaultPath: stampDefaultName("json"),
        filters: [{ name: "JSON", extensions: ["json"] }],
      });
      if (!path) return { ok: false, cancelled: true };
      await writeTextFile(path, body);
      return { ok: true, path, rows, tables };
    }

    const filename = stampDefaultName("json");
    downloadTextFile(filename, body, "application/json");
    return { ok: true, path: filename, rows, tables };
  } catch (err) {
    return {
      ok: false,
      cancelled: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/** Diálogo Salvar → escreve CSV (Tauri) ou download no navegador. */
export async function exportBackupCsvWithDialog(): Promise<BackupDialogResult> {
  try {
    const payload = await buildBackupPayload();
    const body = backupToCsv(payload);
    const rows = countPayloadRows(payload);
    const tables = countPayloadTables(payload);

    if (isTauriRuntime()) {
      const { save } = await import("@tauri-apps/plugin-dialog");
      const { writeTextFile } = await import("@tauri-apps/plugin-fs");
      const path = await save({
        title: "Exportar CSV Study Bloom",
        defaultPath: stampDefaultName("csv"),
        filters: [{ name: "CSV", extensions: ["csv"] }],
      });
      if (!path) return { ok: false, cancelled: true };
      await writeTextFile(path, body);
      return { ok: true, path, rows, tables };
    }

    const filename = stampDefaultName("csv");
    downloadTextFile(filename, body, "text/csv");
    return { ok: true, path: filename, rows, tables };
  } catch (err) {
    return {
      ok: false,
      cancelled: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Abre JSON e importa.
 * Em replace: confirmação nativa/web — sem OK, não apaga nada.
 */
export async function importBackupWithDialog(
  mode: ImportMode,
): Promise<BackupDialogResult> {
  try {
    let raw: string;
    let pathLabel: string;

    if (isTauriRuntime()) {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const { readTextFile } = await import("@tauri-apps/plugin-fs");
      const selected = await open({
        title: "Importar backup Study Bloom",
        multiple: false,
        filters: [{ name: "JSON", extensions: ["json"] }],
      });
      if (!selected || Array.isArray(selected)) {
        return { ok: false, cancelled: true };
      }
      pathLabel = selected;
      raw = await readTextFile(selected);
    } else {
      const picked = await pickTextFile(".json,application/json");
      if (picked.cancelled) return { ok: false, cancelled: true };
      pathLabel = picked.name;
      raw = picked.text;
    }

    const payload = parseBackupJson(raw);

    if (mode === "replace") {
      const confirmed = await confirmReplaceBackup();
      if (!confirmed) return { ok: false, cancelled: true };
    }

    const stats = await applyBackupPayload(payload, mode);
    return { ok: true, path: pathLabel, ...stats };
  } catch (err) {
    return {
      ok: false,
      cancelled: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
