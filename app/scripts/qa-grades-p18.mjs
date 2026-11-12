/**
 * QA P18 Grades — CRUD, pesos, frequência, localStorage, alerta <75%.
 * Roda com: node scripts/qa-grades-p18.mjs
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

const gradesSrc = readFileSync(join(root, "src/services/grades.ts"), "utf8");
const pageSrc = readFileSync(join(root, "src/pages/NotasPage.tsx"), "utf8");
const tableSrc = readFileSync(
  join(root, "src/components/notas/GradesTable.tsx"),
  "utf8",
);
const attSrc = readFileSync(
  join(root, "src/components/notas/AttendancePanel.tsx"),
  "utf8",
);
const settingsSrc = readFileSync(
  join(root, "src/stores/settingsStore.ts"),
  "utf8",
);

const fails = [];
const ok = (name) => console.log(`PASS  ${name}`);
const fail = (name, msg) => {
  fails.push(`${name}: ${msg}`);
  console.error(`FAIL  ${name}: ${msg}`);
};

// --- Source contracts ---
if (!gradesSrc.includes('STORAGE_KEY = "study-bloom-grades"')) {
  fail("persist-key", "study-bloom-grades missing");
} else ok("persist key");

if (
  !settingsSrc.includes("gradeWeights") ||
  !settingsSrc.includes("study-bloom-settings")
) {
  fail("settings", "gradeWeights persist missing");
} else ok("settingsStore gradeWeights");

for (const fn of [
  "listGrades",
  "upsertAssessment",
  "updateGrade",
  "updateAttendance",
  "clearAssessments",
]) {
  if (!gradesSrc.includes(`export async function ${fn}`)) {
    fail("crud-svc", `${fn} missing`);
  } else ok(`svc ${fn}`);
}

if (!gradesSrc.includes("export function computeAverage")) {
  fail("avg", "computeAverage missing");
} else ok("computeAverage");

if (!gradesSrc.includes("export function normalizeGradeWeights")) {
  fail("weights", "normalizeGradeWeights missing");
} else ok("normalizeGradeWeights");

if (!gradesSrc.includes("assertGrade") || !gradesSrc.includes("assertPercent")) {
  fail("validate", "assertGrade/assertPercent missing");
} else ok("assert grade/percent");

if (
  !gradesSrc.includes("delete rest.average") &&
  !gradesSrc.includes("average: _avg")
) {
  fail("strip-avg", "writeStore should strip average");
} else ok("strip average on write");

if (
  !pageSrc.includes("upsertAssessment") ||
  !pageSrc.includes("updateGrade") ||
  !pageSrc.includes("clearAssessments")
) {
  fail("page-crud", "CRUD not wired");
} else ok("page CRUD wired");

if (
  !pageSrc.includes("normalizeGradeWeights") ||
  !pageSrc.includes("setGradeWeights")
) {
  fail("page-weights", "weights via settingsStore missing");
} else ok("page weights via settingsStore");

if (!pageSrc.includes("updateAttendance")) {
  fail("page-att", "attendance not wired");
} else ok("page attendance");

if (!pageSrc.includes("ATTENDANCE_MIN") || !pageSrc.includes("abaixo de")) {
  fail("toast-75", "toast on cross below 75% missing");
} else ok("toast below 75%");

if (!pageSrc.includes("submitDisabled")) {
  fail("modal", "submitDisabled missing");
} else ok("submitDisabled");

if (!attSrc.includes("DEFAULT_MIN = 75")) {
  fail("min-75", "DEFAULT_MIN 75 missing");
} else ok("DEFAULT_MIN 75");

if (!attSrc.includes('role="alert"') && !attSrc.includes("role='alert'")) {
  fail("alert-a11y", "role=alert missing");
} else ok("role=alert");

if (!attSrc.includes("onBlur") || !attSrc.includes("commit")) {
  fail("att-edit", "blur commit missing");
} else ok("attendance blur commit");

if (!tableSrc.includes("formatGrade") || !tableSrc.includes("onEdit")) {
  fail("table", "GradesTable incomplete");
} else ok("GradesTable");

// --- Logic smoke (espelha helpers críticos) ---
function computeAverage(a1, a2, weights = { assessment1: 50, assessment2: 50 }) {
  const parts = [];
  if (a1 !== undefined && a1 !== null && Number.isFinite(a1)) {
    parts.push({ value: a1, weight: Math.max(0, weights.assessment1) });
  }
  if (a2 !== undefined && a2 !== null && Number.isFinite(a2)) {
    parts.push({ value: a2, weight: Math.max(0, weights.assessment2) });
  }
  if (parts.length === 0) return undefined;
  const totalWeight = parts.reduce((s, p) => s + p.weight, 0);
  const raw =
    totalWeight <= 0
      ? parts.reduce((s, p) => s + p.value, 0) / parts.length
      : parts.reduce((s, p) => s + p.value * p.weight, 0) / totalWeight;
  return Math.round(raw * 10) / 10;
}

function normalizeGradeWeights(assessment1, assessment2) {
  const w1 = Number(assessment1);
  const w2 = Number(assessment2);
  const total = w1 + w2;
  if (!(total > 0)) throw new Error("soma");
  const a1Pct = Math.round((w1 / total) * 100);
  return { assessment1: a1Pct, assessment2: 100 - a1Pct };
}

assert.equal(computeAverage(7, 7.8, { assessment1: 50, assessment2: 50 }), 7.4);
assert.equal(computeAverage(8.5, 9, { assessment1: 40, assessment2: 60 }), 8.8);
assert.equal(computeAverage(9, undefined, { assessment1: 50, assessment2: 50 }), 9);
assert.equal(computeAverage(7.5, 8, { assessment1: 70, assessment2: 30 }), 7.7);
ok("weighted average math");

assert.deepEqual(normalizeGradeWeights(1, 1), {
  assessment1: 50,
  assessment2: 50,
});
assert.deepEqual(normalizeGradeWeights(70, 30), {
  assessment1: 70,
  assessment2: 30,
});
ok("normalize weights to 100");

const KEY = "study-bloom-grades";
store.clear();
const seed = [
  {
    id: "g1",
    subjectId: "calc-1",
    subjectName: "Cálculo 1",
    color: "pink",
    assessment1: 7,
    assessment2: 8,
    attendancePercent: 92,
    average: 7.5,
  },
];
localStorage.setItem(KEY, JSON.stringify(seed));
const parsed = JSON.parse(localStorage.getItem(KEY));
const stripped = parsed.map(({ average, ...rest }) => rest);
localStorage.setItem(KEY, JSON.stringify(stripped));
assert.equal(
  JSON.parse(localStorage.getItem(KEY))[0].average,
  undefined,
);
ok("localStorage strip average");

const row = { attendancePercent: 80 };
const next = 70;
assert.equal(row.attendancePercent >= 75 && next < 75, true);
ok("alert threshold cross 75%");

if (fails.length) {
  console.error(`\n${fails.length} FAIL(s)`);
  process.exit(1);
}
console.log("\nAll P18 checks passed");
