/**
 * Store do semestre atual
 * -----------------------
 * Compartilhado entre AppShell, Configurações e demais telas (P22).
 * Persistido no localStorage.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Semester } from "../types";

type SemesterState = {
  semester: Semester;
  setSemester: (semester: Semester) => void;
  updateSemester: (patch: Partial<Pick<Semester, "label" | "course">>) => void;
};

function semesterIdFromLabel(label: string): string {
  const cleaned = label.trim().replace(/\s+/g, "");
  return cleaned.length > 0 ? cleaned.replace(/\./g, "-") : "semestre";
}

export const useSemesterStore = create<SemesterState>()(
  persist(
    (set, get) => ({
      // Seed neutro — o usuário edita no AppShell / Configurações (persistido).
      semester: {
        id: "semestre",
        label: "Semestre",
        course: "Seu curso",
      },
      setSemester: (semester) => set({ semester }),
      updateSemester: (patch) => {
        const current = get().semester;
        const label = patch.label ?? current.label;
        const course = patch.course ?? current.course;
        set({
          semester: {
            id: semesterIdFromLabel(label),
            label: label.trim() || current.label,
            course: course.trim() || current.course,
          },
        });
      },
    }),
    {
      name: "study-bloom-semester",
      partialize: (state) => ({ semester: state.semester }),
    },
  ),
);
