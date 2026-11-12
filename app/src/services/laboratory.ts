import type { StudyFile } from "../types";

export const DEFAULT_PYTHON = `def media(notas):
    if not notas:
        return 0
    return sum(notas) / len(notas)

notas = [7.0, 8.5, 9.0]
print(f'Média: {media(notas):.2f}')
`;

export const DEFAULT_LATEX = "\\int_0^1 x^2 \\, dx";
export const DEFAULT_LATEX_PREVIEW = "\\int_0^1 x^2 \\, dx = \\dfrac{1}{3}";

const MOCK_FILES: (StudyFile & { tint: "lavender" | "pink" | "mint" })[] = [
  {
    id: "f1",
    subjectId: "algoritmos",
    name: "media.py",
    language: "python",
    content: DEFAULT_PYTHON,
    tint: "lavender",
  },
  {
    id: "f2",
    subjectId: "calc-1",
    name: "integrais.tex",
    language: "latex",
    content: DEFAULT_LATEX,
    tint: "pink",
  },
  {
    id: "f3",
    subjectId: "bd",
    name: "consultas.sql",
    language: "sql",
    content: "SELECT * FROM alunos;",
    tint: "mint",
  },
];

export async function listStudyFiles() {
  return MOCK_FILES;
}
