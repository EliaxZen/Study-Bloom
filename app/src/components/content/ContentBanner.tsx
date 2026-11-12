import type { SubjectColor } from "../../types";

type ContentBannerProps = {
  icon: string;
  subjectName: string;
  color?: SubjectColor;
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

export function ContentBanner({
  icon,
  subjectName,
  color = "pink",
}: ContentBannerProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-r px-4 py-4 sm:px-6 sm:py-5 ${BANNER_GRADIENT[color]}`}
    >
      <div className="pointer-events-none absolute -right-8 -top-10 hidden h-40 w-40 rounded-full bg-white/40 sm:block" />
      <div className="pointer-events-none absolute right-16 bottom-0 hidden h-24 w-24 rounded-full bg-bloom-200/30 sm:block" />
      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 sm:pr-40">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <span
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-2xl font-bold shadow-sm sm:h-14 sm:w-14 sm:text-3xl ${BANNER_ACCENT[color]}`}
          >
            {icon}
          </span>
          <h2 className="min-w-0 truncate text-xl font-bold text-ink sm:text-2xl">
            {subjectName}
          </h2>
        </div>
        <button
          type="button"
          className={`min-h-11 self-start text-xs font-medium hover:underline sm:absolute sm:bottom-4 sm:right-5 sm:min-h-0 ${BANNER_ACCENT[color]}`}
        >
          Personalizar capa e ícone ✎
        </button>
      </div>
    </div>
  );
}
