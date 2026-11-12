/**
 * Store do semestre atual
 * -----------------------
 * Exemplo simples de Zustand para a namorada entender o padrão.
 */

import { create } from "zustand";
import type { Semester } from "../types";

type SemesterState = {
  semester: Semester;
  setSemester: (semester: Semester) => void;
};

export const useSemesterStore = create<SemesterState>((set) => ({
  semester: {
    id: "2026-2",
    label: "2026.2",
    course: "Ciência da Computação",
  },
  setSemester: (semester) => set({ semester }),
}));
