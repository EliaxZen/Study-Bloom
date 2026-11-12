/**
 * Acentos pastel do Study Bloom
 * -----------------------------
 * Gera a escala bloom-* a partir de um hex base (≈ bloom-600).
 * Em dark mode NÃO sobrescreve bloom-50..300 (superfícies do agente dark).
 */

export type AccentPresetId =
  | "lavender"
  | "rose"
  | "mint"
  | "peach"
  | "sky"
  | "custom";

export type AccentPreset = {
  id: Exclude<AccentPresetId, "custom">;
  label: string;
  /** Tom médio (botões / links) — pastel Study Bloom */
  hex: string;
};

export const ACCENT_PRESETS: AccentPreset[] = [
  { id: "lavender", label: "Lavanda", hex: "#7c5fbd" },
  { id: "rose", label: "Rosa", hex: "#c9709a" },
  { id: "mint", label: "Menta", hex: "#5a9e86" },
  { id: "peach", label: "Pêssego", hex: "#c9956c" },
  { id: "sky", label: "Céu", hex: "#6b9bc3" },
];

export const DEFAULT_ACCENT_PRESET_ID: AccentPresetId = "lavender";
export const DEFAULT_ACCENT_HEX = ACCENT_PRESETS[0].hex;

export type ThemeAccentPersisted = {
  presetId: AccentPresetId;
  hex: string;
};

export type BloomScale = {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
};

type Rgb = { r: number; g: number; b: number };

function clampByte(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

export function normalizeHex(input: string): string | null {
  const raw = input.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(raw)) return null;
  return `#${raw.toLowerCase()}`;
}

function hexToRgb(hex: string): Rgb {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function rgbToHex({ r, g, b }: Rgb): string {
  return `#${[r, g, b]
    .map((v) => clampByte(v).toString(16).padStart(2, "0"))
    .join("")}`;
}

/** Mistura canal a canal (t=0 → a, t=1 → b). */
function mix(a: Rgb, b: Rgb, t: number): Rgb {
  return {
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t,
  };
}

const WHITE: Rgb = { r: 255, g: 255, b: 255 };
const INKISH: Rgb = { r: 45, g: 38, b: 64 };

/**
 * Escala bloom a partir do hex base (posição 600).
 * Tons claros ficam bem pastel; escuros mantêm legibilidade em botões.
 */
export function buildBloomScale(baseHex: string): BloomScale {
  const base = hexToRgb(normalizeHex(baseHex) ?? DEFAULT_ACCENT_HEX);
  return {
    50: rgbToHex(mix(WHITE, base, 0.06)),
    100: rgbToHex(mix(WHITE, base, 0.12)),
    200: rgbToHex(mix(WHITE, base, 0.22)),
    300: rgbToHex(mix(WHITE, base, 0.36)),
    400: rgbToHex(mix(WHITE, base, 0.55)),
    500: rgbToHex(mix(WHITE, base, 0.78)),
    600: rgbToHex(base),
    700: rgbToHex(mix(base, INKISH, 0.22)),
    800: rgbToHex(mix(base, INKISH, 0.4)),
    900: rgbToHex(mix(base, INKISH, 0.55)),
  };
}

const SOFT_STEPS = [50, 100, 200, 300] as const;
const CHROME_STEPS = [400, 500, 600, 700, 800, 900] as const;

/**
 * Aplica vars de acento compartilháveis com dark mode.
 * - light: escala completa
 * - dark: só 400–900 + primary/accent (50–300 ficam no CSS dark)
 */
export function applyAccentCssVars(hex: string): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const scale = buildBloomScale(hex);
  const isDark = root.classList.contains("dark");

  root.style.setProperty("--accent-base", scale[600]);

  for (const step of SOFT_STEPS) {
    if (isDark) {
      root.style.removeProperty(`--color-bloom-${step}`);
    } else {
      root.style.setProperty(`--color-bloom-${step}`, scale[step]);
    }
  }

  for (const step of CHROME_STEPS) {
    root.style.setProperty(`--color-bloom-${step}`, scale[step]);
  }

  root.style.setProperty("--color-accent", scale[500]);
  root.style.setProperty("--color-primary", scale[600]);
  root.style.setProperty("--color-accent-soft", scale[100]);
  root.style.setProperty("--color-accent-muted", scale[200]);
  root.style.setProperty("--color-accent-strong", scale[700]);
  root.dataset.accent = hex;
}

/** Boot síncrono do cache local (evita flash antes do hydrate async). */
export function bootAccentFromLocalCache(): void {
  if (typeof localStorage === "undefined") return;
  try {
    const bundled = localStorage.getItem("study-bloom-theme-prefs");
    if (bundled) {
      const parsed = JSON.parse(bundled) as { hex?: string };
      const hex = normalizeHex(String(parsed.hex ?? ""));
      if (hex) {
        applyAccentCssVars(hex);
        return;
      }
    }
    const raw = localStorage.getItem("study-bloom:theme.accent");
    if (!raw) return;
    const parsed = JSON.parse(raw) as { hex?: string };
    const hex =
      typeof parsed.hex === "string"
        ? normalizeHex(parsed.hex)
        : normalizeHex(raw);
    if (hex) applyAccentCssVars(hex);
  } catch {
    /* ignore */
  }
}

export function resolvePresetHex(
  presetId: AccentPresetId,
  customHex?: string,
): string {
  if (presetId === "custom") {
    return normalizeHex(customHex ?? "") ?? DEFAULT_ACCENT_HEX;
  }
  return (
    ACCENT_PRESETS.find((p) => p.id === presetId)?.hex ?? DEFAULT_ACCENT_HEX
  );
}

export function matchPresetId(hex: string): AccentPresetId {
  const n = normalizeHex(hex);
  if (!n) return "custom";
  const found = ACCENT_PRESETS.find((p) => p.hex === n);
  return found?.id ?? "custom";
}

export function isAccentPresetId(value: unknown): value is AccentPresetId {
  return (
    value === "lavender" ||
    value === "rose" ||
    value === "mint" ||
    value === "peach" ||
    value === "sky" ||
    value === "custom"
  );
}
