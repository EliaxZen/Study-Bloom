/**
 * Smoke test P3: escala accent + roundtrip prefs (localStorage mock).
 * Rode: node scripts/test-theme-persist.mjs
 */

function normalizeHex(input) {
  const raw = String(input).trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(raw)) return null;
  return `#${raw.toLowerCase()}`;
}

function mix(a, b, t) {
  return {
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t,
  };
}

function clampByte(n) {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function rgbToHex({ r, g, b }) {
  return `#${[r, g, b]
    .map((v) => clampByte(v).toString(16).padStart(2, "0"))
    .join("")}`;
}

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

const WHITE = { r: 255, g: 255, b: 255 };
const INKISH = { r: 45, g: 38, b: 64 };

function buildBloomScale(baseHex) {
  const base = hexToRgb(normalizeHex(baseHex) ?? "#7c5fbd");
  return {
    50: rgbToHex(mix(WHITE, base, 0.06)),
    100: rgbToHex(mix(WHITE, base, 0.12)),
    600: rgbToHex(base),
    700: rgbToHex(mix(base, INKISH, 0.22)),
  };
}

const LS_KEY = "study-bloom-theme-prefs";
const store = new Map();

function save(prefs) {
  store.set(LS_KEY, JSON.stringify(prefs));
}

function load() {
  const raw = store.get(LS_KEY);
  return raw ? JSON.parse(raw) : null;
}

const mint = "#5a9e86";
const scale = buildBloomScale(mint);
const prefs = { presetId: "mint", hex: mint, mode: "light" };
save(prefs);
const loaded = load();

const ok =
  loaded?.presetId === "mint" &&
  loaded?.hex === mint &&
  scale[600] === mint &&
  normalizeHex("#5A9E86") === mint;

console.log(
  JSON.stringify(
    {
      ok,
      scale600: scale[600],
      scale50: scale[50],
      loaded,
    },
    null,
    2,
  ),
);

if (!ok) process.exit(1);
