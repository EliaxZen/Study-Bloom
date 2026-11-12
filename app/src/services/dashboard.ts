/**
 * Dados mock da Visão geral (tela 01) — alinhados ao Figma.
 */

import type { SubjectColor } from "../types";

export type AgendaItem = {
  id: string;
  time: string;
  title: string;
  detail: string;
  color: SubjectColor;
};

export type DeliveryItem = {
  id: string;
  title: string;
  when: string;
  done: boolean;
};

export type DashboardStat = {
  id: string;
  label: string;
  value: string;
  iconTone: "lavender" | "blue" | "pink";
};

export async function getDashboardStats(): Promise<DashboardStat[]> {
  return [
    {
      id: "pending",
      label: "Tarefas pendentes",
      value: "08",
      iconTone: "lavender",
    },
    {
      id: "classes",
      label: "Aulas nesta semana",
      value: "14",
      iconTone: "blue",
    },
    {
      id: "exam",
      label: "Próxima avaliação",
      value: "18 nov",
      iconTone: "pink",
    },
  ];
}

export async function getTodayAgenda(): Promise<AgendaItem[]> {
  return [
    {
      id: "a1",
      time: "08:00",
      title: "Cálculo 1",
      detail: "Integrais indefinidas",
      color: "lavender",
    },
    {
      id: "a2",
      time: "10:00",
      title: "Redes de Computadores",
      detail: "Camada de rede",
      color: "mint",
    },
    {
      id: "a3",
      time: "14:00",
      title: "Algoritmos",
      detail: "Lista de exercícios",
      color: "pink",
    },
    {
      id: "a4",
      time: "19:00",
      title: "Revisão",
      detail: "Sessão de foco · 25 min",
      color: "yellow",
    },
  ];
}

export async function getUpcomingDeliveries(): Promise<DeliveryItem[]> {
  return [
    { id: "d1", title: "Lista de Integrais", when: "Amanhã", done: false },
    { id: "d2", title: "Trabalho de Redes", when: "Sexta", done: false },
    { id: "d3", title: "Revisar SQL", when: "Concluído", done: true },
    { id: "d4", title: "Projeto em Python", when: "18 nov", done: false },
  ];
}
