import type { GradeEntry, SubjectColor } from "../types";

export type GradeRow = GradeEntry & {
  subjectName: string;
  color: SubjectColor;
};

const MOCK_GRADES: GradeRow[] = [
  {
    id: "g1",
    subjectId: "calc-1",
    subjectName: "Cálculo 1",
    color: "pink",
    assessment1: 7.0,
    assessment2: 7.8,
    average: 7.4,
    attendancePercent: 92,
  },
  {
    id: "g2",
    subjectId: "redes",
    subjectName: "Redes de Computadores",
    color: "mint",
    assessment1: 8.5,
    assessment2: 9.0,
    average: 8.8,
    attendancePercent: 88,
  },
  {
    id: "g3",
    subjectId: "algoritmos",
    subjectName: "Algoritmos",
    color: "lavender",
    assessment1: 9.0,
    assessment2: 8.5,
    average: 8.8,
    attendancePercent: 96,
  },
  {
    id: "g4",
    subjectId: "bd",
    subjectName: "Banco de Dados",
    color: "yellow",
    assessment1: 8.2,
    average: 8.2,
    attendancePercent: 85,
  },
  {
    id: "g5",
    subjectId: "es",
    subjectName: "Engenharia de Software",
    color: "blue",
    assessment1: 7.5,
    assessment2: 8.0,
    average: 7.8,
    attendancePercent: 84,
  },
];

export async function listGrades(): Promise<GradeRow[]> {
  return MOCK_GRADES;
}

export function formatGrade(value?: number): string {
  if (value === undefined || value === null) return "—";
  return value.toFixed(1).replace(".", ",");
}
