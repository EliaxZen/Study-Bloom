import type { SubjectColor } from "../types";

/** Alias legado — fonte única em `colors.ts` */
export {
  PASTEL_BG as SUBJECT_BG,
  PASTEL_BAR,
  PASTEL_HEX,
} from "./colors";

export const SUBJECT_TEXT: Record<SubjectColor, string> = {
  pink: "text-rose-700",
  mint: "text-emerald-700",
  lavender: "text-bloom-700",
  yellow: "text-amber-800",
  blue: "text-sky-700",
};
