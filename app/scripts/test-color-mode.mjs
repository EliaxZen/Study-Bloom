/**
 * Teste P4: persistência + classe dark + reload (simulado, sem jsdom).
 * Roda: node scripts/test-color-mode.mjs
 */

import assert from "node:assert/strict";

const LS_KEY = "study-bloom-theme-prefs";

function makeDoc() {
  const classList = {
    _set: new Set(),
    toggle(name, force) {
      if (force) this._set.add(name);
      else this._set.delete(name);
    },
    contains(name) {
      return this._set.has(name);
    },
  };
  const el = {
    classList,
    dataset: {},
    style: {},
  };
  return {
    documentElement: el,
    body: {
      classList: {
        _set: new Set(),
        toggle(name, force) {
          if (force) this._set.add(name);
          else this._set.delete(name);
        },
        contains(name) {
          return this._set.has(name);
        },
      },
      dataset: {},
    },
  };
}

function makeStore(seed = {}) {
  const data = { ...seed };
  return {
    getItem(k) {
      return Object.prototype.hasOwnProperty.call(data, k) ? data[k] : null;
    },
    setItem(k, v) {
      data[k] = String(v);
    },
  };
}

function normalizePrefs(raw) {
  const defaults = {
    presetId: "lavender",
    hex: "#7c5fbd",
    mode: "light",
  };
  if (!raw || typeof raw !== "object") return { ...defaults };
  const mode =
    raw.mode === "light" || raw.mode === "dark" || raw.mode === "system"
      ? raw.mode
      : "light";
  return {
    presetId:
      typeof raw.presetId === "string" ? raw.presetId : defaults.presetId,
    hex: typeof raw.hex === "string" ? raw.hex : defaults.hex,
    mode,
  };
}

function resolveMode(mode, prefersDark) {
  if (mode === "system") return prefersDark ? "dark" : "light";
  return mode;
}

function applyMode(doc, mode, prefersDark = false) {
  const resolved = resolveMode(mode, prefersDark);
  doc.documentElement.dataset.theme = resolved;
  doc.documentElement.classList.toggle("dark", resolved === "dark");
  doc.documentElement.style.colorScheme = resolved;
  doc.body.dataset.theme = resolved;
  doc.body.classList.toggle("dark", resolved === "dark");
  return resolved;
}

function save(store, prefs) {
  store.setItem(LS_KEY, JSON.stringify(normalizePrefs(prefs)));
}

function load(store) {
  const raw = store.getItem(LS_KEY);
  if (!raw) return normalizePrefs(null);
  return normalizePrefs(JSON.parse(raw));
}

function bootFouc(doc, store, prefersDark = false) {
  let pref = "light";
  const raw = store.getItem(LS_KEY);
  if (raw) {
    const parsed = JSON.parse(raw);
    if (parsed?.mode) pref = parsed.mode;
  }
  const dark = pref === "dark" || (pref === "system" && prefersDark);
  doc.documentElement.classList.toggle("dark", dark);
  doc.documentElement.dataset.theme = dark ? "dark" : "light";
  doc.body.classList.toggle("dark", dark);
  doc.body.dataset.theme = dark ? "dark" : "light";
  return dark ? "dark" : "light";
}

const store = makeStore();
const doc = makeDoc();

assert.equal(load(store).mode, "light");
assert.equal(bootFouc(doc, store), "light");
assert.equal(doc.documentElement.classList.contains("dark"), false);

applyMode(doc, "dark");
save(store, { mode: "dark", presetId: "mint", hex: "#5a9e86" });
assert.equal(doc.documentElement.classList.contains("dark"), true);
assert.equal(doc.body.classList.contains("dark"), true);
assert.equal(doc.documentElement.dataset.theme, "dark");
assert.equal(load(store).mode, "dark");
assert.equal(load(store).presetId, "mint");

const reloaded = makeDoc();
assert.equal(bootFouc(reloaded, store), "dark");
assert.equal(reloaded.documentElement.classList.contains("dark"), true);
assert.equal(reloaded.body.classList.contains("dark"), true);
assert.equal(load(store).hex, "#5a9e86");

applyMode(reloaded, "light");
save(store, { ...load(store), mode: "light" });
const again = makeDoc();
assert.equal(bootFouc(again, store), "light");
assert.equal(again.documentElement.classList.contains("dark"), false);

console.log("OK — toggle + reload (FOUC) + accent coexist");
