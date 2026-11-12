import { useEffect, useState } from "react";
import type { SubjectColor } from "../../types";
import { SimpleModal } from "../ui/SimpleModal";

type ContentBannerProps = {
  icon: string;
  subjectName: string;
  color?: SubjectColor;
  onSaveCover: (next: { icon: string; color: SubjectColor }) => void;
};

const BANNER_GRADIENT: Record<SubjectColor, string> = {
  pink: "from-pastel-pink via-[#fce7f3] to-[#f3e8ff]",
  mint: "from-pastel-mint via-[#d1fae5] to-[#ecfdf5]",
  lavender: "from-pastel-lavender via-[#ede9fe] to-[#f5f3ff]",
  yellow: "from-pastel-yellow via-[#fef3c7] to-[#fffbeb]",
  blue: "from-pastel-blue via-[#dbeafe] to-[#eff6ff]",
};

const BANNER_ACCENT: Record<SubjectColor, string> = {
  pink: "text-[#db2777]",
  mint: "text-emerald-700",
  lavender: "text-bloom-700",
  yellow: "text-amber-700",
  blue: "text-sky-700",
};

const COLOR_OPTIONS: { value: SubjectColor; label: string; swatch: string }[] =
  [
    { value: "pink", label: "Rosa", swatch: "bg-pastel-pink" },
    { value: "mint", label: "Menta", swatch: "bg-pastel-mint" },
    { value: "lavender", label: "Lavanda", swatch: "bg-pastel-lavender" },
    { value: "yellow", label: "Amarelo", swatch: "bg-pastel-yellow" },
    { value: "blue", label: "Azul", swatch: "bg-pastel-blue" },
  ];

const ICON_PRESETS = ["∫", "</>", "⌘", "▦", "✎", "Σ", "λ", "∞", "✿", "★"];

export function ContentBanner({
  icon,
  subjectName,
  color = "pink",
  onSaveCover,
}: ContentBannerProps) {
  const safeColor: SubjectColor = BANNER_GRADIENT[color] ? color : "pink";
  const [open, setOpen] = useState(false);
  const [draftIcon, setDraftIcon] = useState(icon);
  const [draftColor, setDraftColor] = useState<SubjectColor>(safeColor);
  const previewColor: SubjectColor = BANNER_GRADIENT[draftColor]
    ? draftColor
    : "pink";

  useEffect(() => {
    if (!open) return;
    setDraftIcon(icon);
    setDraftColor(safeColor);
  }, [open, icon, safeColor]);

  return (
    <>
      <div
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-r px-4 py-4 sm:px-6 sm:py-5 ${BANNER_GRADIENT[safeColor]}`}
      >
        <div className="pointer-events-none absolute -right-8 -top-10 hidden h-40 w-40 rounded-full bg-white/40 sm:block" />
        <div className="pointer-events-none absolute right-16 bottom-0 hidden h-24 w-24 rounded-full bg-bloom-200/30 sm:block" />
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 sm:pr-40">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <span
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-2xl font-bold shadow-sm sm:h-14 sm:w-14 sm:text-3xl ${BANNER_ACCENT[safeColor]}`}
            >
              {icon || "✿"}
            </span>
            <h2 className="min-w-0 truncate text-xl font-bold text-ink sm:text-2xl">
              {subjectName}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className={`min-h-11 self-start text-xs font-medium hover:underline sm:absolute sm:bottom-4 sm:right-5 sm:min-h-0 ${BANNER_ACCENT[safeColor]}`}
          >
            Personalizar capa e ícone ✎
          </button>
        </div>
      </div>

      <SimpleModal
        open={open}
        onClose={() => setOpen(false)}
        title="Personalizar capa"
        description="Escolha ícone e cor do banner desta disciplina."
        saveLabel="Salvar"
        onSave={() => {
          const nextIcon = draftIcon.trim() || icon || "✿";
          onSaveCover({ icon: nextIcon, color: previewColor });
        }}
      >
        <div className="space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink">Ícone</span>
            <input
              type="text"
              value={draftIcon}
              maxLength={4}
              onChange={(e) => setDraftIcon(e.target.value)}
              className="w-full rounded-xl border border-bloom-200 bg-bloom-50/50 px-3 py-2.5 text-sm outline-none focus:border-bloom-400"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {ICON_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setDraftIcon(preset)}
                className={`flex h-10 w-10 items-center justify-center rounded-xl border text-lg ${
                  draftIcon === preset
                    ? "border-bloom-500 bg-bloom-100"
                    : "border-bloom-100 bg-white hover:border-bloom-300"
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-ink">Cor da capa</legend>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDraftColor(opt.value)}
                  className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ${
                    draftColor === opt.value
                      ? "border-bloom-500 ring-2 ring-bloom-200"
                      : "border-bloom-100"
                  }`}
                >
                  <span className={`h-4 w-4 rounded-full ${opt.swatch}`} />
                  {opt.label}
                </button>
              ))}
            </div>
          </fieldset>
          <div
            className={`rounded-xl bg-gradient-to-r px-4 py-3 ${BANNER_GRADIENT[previewColor]}`}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 text-xl font-bold">
                {draftIcon || "✿"}
              </span>
              <span className="text-sm font-semibold text-ink">{subjectName}</span>
            </div>
          </div>
        </div>
      </SimpleModal>
    </>
  );
}
