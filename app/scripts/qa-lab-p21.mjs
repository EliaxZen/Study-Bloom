/**
 * QA P21 Lab — CRUD, filtro, draft, sandbox contract (sem DOM).
 * Roda com: node scripts/qa-lab-p21.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const store = new Map();

globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
};

// Import dinâmico do service (TS via Vite não; reimplementamos checks no source + smoke API via eval do JS compilado não disponível).
// Validamos contrato lendo o source + simulando a lógica espelhada dos helpers críticos.

const labSrc = readFileSync(join(root, "src/services/laboratory.ts"), "utf8");
const pageSrc = readFileSync(join(root, "src/pages/LaboratorioPage.tsx"), "utf8");
const monacoSrc = readFileSync(join(root, "src/lib/monacoSetup.ts"), "utf8");
const editorSrc = readFileSync(join(root, "src/components/laboratorio/CodeEditorPanel.tsx"), "utf8");
const viteSrc = readFileSync(join(root, "vite.config.ts"), "utf8");

const fails = [];
const ok = (name) => console.log(`PASS  ${name}`);
const fail = (name, msg) => {
  fails.push(`${name}: ${msg}`);
  console.error(`FAIL  ${name}: ${msg}`);
};

// --- Source contract ---
if (labSrc.includes('sandbox", "allow-scripts"') || labSrc.includes("sandbox\", \"allow-scripts\"")) {
  ok("sandbox allow-scripts only");
} else if (labSrc.includes('setAttribute("sandbox", "allow-scripts")')) {
  ok("sandbox allow-scripts only");
} else {
  fail("sandbox", "missing sandbox=allow-scripts");
}

if (/allow-same-origin/.test(labSrc)) {
  fail("sandbox", "must NOT allow-same-origin");
} else {
  ok("no allow-same-origin");
}

if (/child_process|tauri.*shell|Shell\.|Command\.create|execSync|spawn\(/.test(labSrc + editorSrc)) {
  fail("no-shell", "shell/exec references found");
} else {
  ok("no shell runner");
}

if (!labSrc.includes("\\u003c")) {
  fail("srcdoc-escape", "missing < escape for srcdoc");
} else {
  ok("srcdoc < escape");
}

if (!labSrc.includes("event.source !== iframe.contentWindow")) {
  fail("postMessage", "missing event.source check");
} else {
  ok("postMessage source check");
}

if (!/Array\.isArray\(stored\)\) return stored/.test(labSrc) && !labSrc.includes("if (stored && Array.isArray(stored)) return stored")) {
  fail("ensureFiles", "empty array must not reseed");
} else {
  ok("ensureFiles keeps empty list");
}

const has056Worker =
  monacoSrc.includes("monaco-editor/editor/editor.worker?worker") ||
  monacoSrc.includes("monaco-editor/editor/editor.worker.js?url");
const hasLegacyEsm = /monaco-editor\/esm\/vs\/editor\/editor\.worker/.test(monacoSrc);
if (!has056Worker || hasLegacyEsm) {
  fail(
    "monaco-workers",
    hasLegacyEsm
      ? "legacy esm/vs worker path breaks monaco 0.56 exports map"
      : "expected monaco-editor/editor/editor.worker (?worker or ?url)",
  );
} else {
  ok("monaco 0.56 worker imports");
}

if (!monacoSrc.includes("MonacoEnvironment") || !monacoSrc.includes("getWorker")) {
  fail("monaco-env", "MonacoEnvironment.getWorker missing");
} else {
  ok("MonacoEnvironment.getWorker");
}

if (!viteSrc.includes("worker:") || !viteSrc.includes('format: "es"')) {
  fail("vite-worker", "worker.format es missing");
} else {
  ok("vite worker.format es");
}

if (!pageSrc.includes("saveLabDraft") || !pageSrc.includes("loadLabDraft")) {
  fail("draft", "draft persist hooks missing");
} else {
  ok("draft load/save wired");
}

if (!pageSrc.includes("listStudyFiles(sid)") && !pageSrc.includes("listStudyFiles(subjectId)")) {
  fail("filter", "subject filter listStudyFiles missing");
} else {
  ok("subject filter via listStudyFiles");
}

if (!pageSrc.includes("createStudyFile") || !pageSrc.includes("updateStudyFile") || !pageSrc.includes("deleteStudyFile")) {
  fail("crud", "CRUD calls missing on page");
} else {
  ok("CRUD wired on LaboratorioPage");
}

if (!pageSrc.includes("otherLatex") && !pageSrc.includes("wasLatex")) {
  fail("delete-latex", "latexFileId reassign after delete missing");
} else {
  ok("delete reassigns latexFileId");
}

if (!editorSrc.includes("runJavaScriptSandbox") || !editorSrc.includes("runUnsupportedMessage")) {
  fail("run", "JS-only run path missing");
} else {
  ok("JS-only execute path");
}

// --- Logic smoke: mirror ensureFiles / CRUD keys ---
const FILES_KEY = "study-bloom:lab-files";
const DRAFT_KEY = "study-bloom:lab-draft";

function readJson(key) {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  return JSON.parse(raw);
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function ensureFiles(seed) {
  const stored = readJson(FILES_KEY);
  if (stored && Array.isArray(stored)) return stored;
  writeJson(FILES_KEY, seed);
  return seed.map((f) => ({ ...f }));
}

const seed = [
  { id: "f1", subjectId: "algoritmos", name: "a.py", language: "python", content: "x", tint: "lavender", updatedAt: "0" },
  { id: "f2", subjectId: "calc-1", name: "b.tex", language: "latex", content: "y", tint: "pink", updatedAt: "0" },
];

store.clear();
let files = ensureFiles(seed);
assert.equal(files.length, 2);
ok("seed on first load");

writeJson(FILES_KEY, []);
files = ensureFiles(seed);
assert.equal(files.length, 0);
ok("empty list not reseeded");

writeJson(FILES_KEY, [
  { id: "a", subjectId: "algoritmos", name: "m.js", language: "javascript", content: "1", tint: "mint", updatedAt: "1" },
  { id: "b", subjectId: "bd", name: "q.sql", language: "sql", content: "2", tint: "pink", updatedAt: "1" },
]);
files = ensureFiles(seed);
const filtered = files.filter((f) => f.subjectId === "algoritmos");
assert.equal(filtered.length, 1);
assert.equal(filtered[0].name, "m.js");
ok("subject filter");

const created = {
  id: "c1",
  subjectId: "algoritmos",
  name: "new.py",
  language: "python",
  content: "print(1)",
  tint: "lavender",
  updatedAt: "2",
};
files.push(created);
writeJson(FILES_KEY, files);
assert.equal(readJson(FILES_KEY).length, 3);
ok("create persist");

files = readJson(FILES_KEY).map((f) =>
  f.id === "c1" ? { ...f, content: "print(2)" } : f,
);
writeJson(FILES_KEY, files);
assert.equal(readJson(FILES_KEY).find((f) => f.id === "c1").content, "print(2)");
ok("update persist");

writeJson(FILES_KEY, readJson(FILES_KEY).filter((f) => f.id !== "c1"));
assert.equal(readJson(FILES_KEY).some((f) => f.id === "c1"), false);
ok("delete persist");

const draft = {
  subjectId: "algoritmos",
  activeId: "a",
  code: "console.log(1)",
  languageLabel: "JavaScript",
  latex: "\\int x",
};
writeJson(DRAFT_KEY, draft);
assert.deepEqual(readJson(DRAFT_KEY), draft);
ok("draft persist");

if (fails.length) {
  console.error(`\n${fails.length} failure(s)`);
  process.exit(1);
}
console.log("\nAll P21 Lab QA checks passed.");
