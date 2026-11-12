import type { StudyFile } from "../types";

export const DEFAULT_PYTHON = `def media(notas):
    if not notas:
        return 0
    return sum(notas) / len(notas)

notas = [7.0, 8.5, 9.0]
print(f'Média: {media(notas):.2f}')
`;

export const DEFAULT_JS = `function media(notas) {
  if (!notas.length) return 0;
  const soma = notas.reduce((a, b) => a + b, 0);
  return soma / notas.length;
}

const notas = [7.0, 8.5, 9.0];
console.log("Média:", media(notas).toFixed(2));
`;

export const DEFAULT_LATEX = "\\int_0^1 x^2 \\, dx";
export const DEFAULT_LATEX_PREVIEW = "\\int_0^1 x^2 \\, dx = \\dfrac{1}{3}";

export type LabTint = "lavender" | "pink" | "mint";
export type LabLanguage = StudyFile["language"];

export type LabSnippet = StudyFile & {
  tint: LabTint;
  updatedAt: string;
};

export type LabDraft = {
  subjectId: string;
  activeId: string | null;
  code: string;
  languageLabel: string;
  latex: string;
};

export type RunResult = {
  ok: boolean;
  stdout: string;
  stderr: string;
  limited: boolean;
};

const FILES_KEY = "study-bloom:lab-files";
const DRAFT_KEY = "study-bloom:lab-draft";

const TINT_CYCLE: LabTint[] = ["lavender", "pink", "mint"];

const SEED_FILES: LabSnippet[] = [
  {
    id: "f1",
    subjectId: "algoritmos",
    name: "media.py",
    language: "python",
    content: DEFAULT_PYTHON,
    tint: "lavender",
    updatedAt: new Date(0).toISOString(),
  },
  {
    id: "f2",
    subjectId: "calc-1",
    name: "integrais.tex",
    language: "latex",
    content: DEFAULT_LATEX,
    tint: "pink",
    updatedAt: new Date(0).toISOString(),
  },
  {
    id: "f3",
    subjectId: "bd",
    name: "consultas.sql",
    language: "sql",
    content: "SELECT * FROM alunos;",
    tint: "mint",
    updatedAt: new Date(0).toISOString(),
  },
  {
    id: "f4",
    subjectId: "algoritmos",
    name: "media.js",
    language: "javascript",
    content: DEFAULT_JS,
    tint: "lavender",
    updatedAt: new Date(0).toISOString(),
  },
];

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota / private mode — evita quebrar UI do lab
  }
}

function ensureFiles(): LabSnippet[] {
  const stored = readJson<LabSnippet[]>(FILES_KEY);
  // null = nunca inicializado; [] = usuário apagou todos (não reseed)
  if (stored && Array.isArray(stored)) return stored;
  writeJson(FILES_KEY, SEED_FILES);
  return SEED_FILES.map((f) => ({ ...f }));
}

function persistFiles(files: LabSnippet[]): void {
  writeJson(FILES_KEY, files);
}

export function languageToLabel(language: LabLanguage): string {
  switch (language) {
    case "python":
      return "Python";
    case "sql":
      return "SQL";
    case "javascript":
      return "JavaScript";
    case "c":
      return "C";
    case "latex":
      return "LaTeX";
    case "markdown":
      return "Markdown";
    default:
      return language;
  }
}

export function labelToLanguage(label: string): LabLanguage {
  const key = label.trim().toLowerCase();
  if (key === "python") return "python";
  if (key === "sql") return "sql";
  if (key === "javascript" || key === "js") return "javascript";
  if (key === "c") return "c";
  if (key === "latex" || key === "tex") return "latex";
  if (key === "markdown" || key === "md") return "markdown";
  return "other";
}

export function monacoLanguage(labelOrLang: string): string {
  const lang = labelToLanguage(labelOrLang);
  if (lang === "other") return "plaintext";
  if (lang === "latex") return "plaintext";
  return lang;
}

export async function listStudyFiles(subjectId?: string): Promise<LabSnippet[]> {
  const files = ensureFiles();
  if (!subjectId) return files;
  return files.filter((f) => f.subjectId === subjectId);
}

export async function getStudyFile(id: string): Promise<LabSnippet | undefined> {
  return ensureFiles().find((f) => f.id === id);
}

export async function createStudyFile(input: {
  name: string;
  language: LabLanguage;
  subjectId: string;
  content?: string;
}): Promise<LabSnippet> {
  const files = ensureFiles();
  const tint = TINT_CYCLE[files.length % TINT_CYCLE.length];
  const snippet: LabSnippet = {
    id: `f-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    name: input.name.trim() || "sem-titulo",
    language: input.language,
    subjectId: input.subjectId,
    content: input.content ?? defaultContentFor(input.language),
    tint,
    updatedAt: new Date().toISOString(),
  };
  files.push(snippet);
  persistFiles(files);
  return snippet;
}

export async function updateStudyFile(
  id: string,
  patch: Partial<Pick<LabSnippet, "name" | "content" | "language" | "subjectId" | "tint">>,
): Promise<LabSnippet | undefined> {
  const files = ensureFiles();
  const idx = files.findIndex((f) => f.id === id);
  if (idx < 0) return undefined;
  const next: LabSnippet = {
    ...files[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  files[idx] = next;
  persistFiles(files);
  return next;
}

export async function deleteStudyFile(id: string): Promise<boolean> {
  const files = ensureFiles();
  const next = files.filter((f) => f.id !== id);
  if (next.length === files.length) return false;
  persistFiles(next);
  return true;
}

export function loadLabDraft(): LabDraft | null {
  return readJson<LabDraft>(DRAFT_KEY);
}

export function saveLabDraft(draft: LabDraft): void {
  writeJson(DRAFT_KEY, draft);
}

function defaultContentFor(language: LabLanguage): string {
  switch (language) {
    case "python":
      return DEFAULT_PYTHON;
    case "javascript":
      return DEFAULT_JS;
    case "latex":
      return DEFAULT_LATEX;
    case "sql":
      return "SELECT * FROM alunos;\n";
    case "c":
      return `#include <stdio.h>

int main(void) {
  printf("Olá, Study Bloom!\\n");
  return 0;
}
`;
    default:
      return "";
  }
}

/**
 * Runner limitado: só JavaScript, em iframe sandboxed (sem same-origin).
 * Sem shell, sem rede, sem DOM do app.
 */
export function runJavaScriptSandbox(
  code: string,
  timeoutMs = 2500,
): Promise<RunResult> {
  return new Promise((resolve) => {
    if (typeof document === "undefined") {
      resolve({
        ok: false,
        stdout: "",
        stderr: "Ambiente sem DOM — execução indisponível.",
        limited: true,
      });
      return;
    }

    const iframe = document.createElement("iframe");
    iframe.setAttribute("sandbox", "allow-scripts");
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.cssText =
      "position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0;pointer-events:none;border:0";

    const channel = `lab-run-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    let settled = false;

    const finish = (result: RunResult) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      window.removeEventListener("message", onMessage);
      iframe.remove();
      resolve(result);
    };

    const onMessage = (event: MessageEvent) => {
      if (event.source !== iframe.contentWindow) return;
      const data = event.data;
      if (!data || data.channel !== channel) return;
      finish({
        ok: Boolean(data.ok),
        stdout: String(data.stdout ?? ""),
        stderr: String(data.stderr ?? ""),
        limited: true,
      });
    };

    const timer = window.setTimeout(() => {
      finish({
        ok: false,
        stdout: "",
        stderr: `Tempo esgotado (${timeoutMs}ms). Loop infinito ou código lento.`,
        limited: true,
      });
    }, timeoutMs);

    window.addEventListener("message", onMessage);
    document.body.appendChild(iframe);

    // Escapa `<` no literal JS embutido no srcdoc (HTML parser fecha </script>).
    const userCode = JSON.stringify(`"use strict";\n${code}`).replace(
      /</g,
      "\\u003c",
    );

    const srcdoc = `<!DOCTYPE html><html><head><meta charset="utf-8" /></head><body><script>
(function () {
  var channel = ${JSON.stringify(channel)};
  var logs = [];
  function serialize(v) {
    try {
      if (typeof v === "string") return v;
      if (typeof v === "symbol") return String(v);
      if (typeof v === "function") return "[Function]";
      return JSON.stringify(v, function (_k, val) {
        if (typeof val === "bigint") return String(val);
        if (typeof val === "function") return "[Function]";
        return val;
      }) || String(v);
    } catch (e) {
      return String(v);
    }
  }
  var fakeConsole = {
    log: function () { logs.push(Array.prototype.map.call(arguments, serialize).join(" ")); },
    info: function () { logs.push(Array.prototype.map.call(arguments, serialize).join(" ")); },
    warn: function () { logs.push(Array.prototype.map.call(arguments, serialize).join(" ")); },
    error: function () { logs.push(Array.prototype.map.call(arguments, serialize).join(" ")); }
  };
  function reply(ok, stdout, stderr) {
    parent.postMessage({ channel: channel, ok: ok, stdout: stdout, stderr: stderr }, "*");
  }
  try {
    var fn = new Function("console", ${userCode});
    var ret = fn(fakeConsole);
    if (ret !== undefined) logs.push(serialize(ret));
    reply(true, logs.join("\\n") || "(sem saída)", "");
  } catch (err) {
    reply(false, logs.join("\\n"), err && err.message ? String(err.message) : String(err));
  }
})();
<\/script></body></html>`;

    iframe.srcdoc = srcdoc;
  });
}

/** Mensagem clara para linguagens sem runner local. */
export function runUnsupportedMessage(languageLabel: string): RunResult {
  return {
    ok: false,
    stdout: "",
    stderr: `Execução limitada: apenas JavaScript roda no sandbox local. "${languageLabel}" não é executado (sem shell do sistema).`,
    limited: true,
  };
}
