/**
 * Service de disciplinas
 * ----------------------
 * Funções para listar / criar / atualizar matérias.
 * Hoje usa dados de exemplo; depois liga no SQLite.
 */

import type { Subject } from "../types";

/** Dados mock iguais ao Figma — úteis até o banco estar pronto */
const MOCK_SUBJECTS: Subject[] = [
  {
    id: "calc-1",
    name: "Cálculo 1",
    description: "Integrais, derivadas e aplicações.",
    color: "pink",
    icon: "∫",
    materialsCount: 12,
  },
  {
    id: "redes",
    name: "Redes de Computadores",
    description: "Protocolos, TCP/IP e roteamento.",
    color: "mint",
    icon: "⌘",
    materialsCount: 9,
  },
  {
    id: "algoritmos",
    name: "Algoritmos e Programação",
    description: "Python, estruturas e projetos.",
    color: "lavender",
    icon: "</>",
    materialsCount: 16,
  },
  {
    id: "bd",
    name: "Banco de Dados",
    description: "SQL, modelagem e consultas.",
    color: "yellow",
    icon: "▦",
    materialsCount: 7,
  },
  {
    id: "es",
    name: "Engenharia de Software",
    description: "Requisitos, Git e desenvolvimento.",
    color: "blue",
    icon: "✎",
    materialsCount: 6,
  },
];

export async function listSubjects(): Promise<Subject[]> {
  // TODO: trocar por SELECT no SQLite
  return MOCK_SUBJECTS;
}

export async function getSubjectById(id: string): Promise<Subject | undefined> {
  const subjects = await listSubjects();
  return subjects.find((s) => s.id === id);
}
