import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Brain,
  CalendarDays,
  Code2,
  GraduationCap,
  Home,
  KanbanSquare,
  Bell,
  CalendarRange,
} from "lucide-react";

export type AppRoute = {
  path: string;
  label: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
};

/** Nav completa alinhada às telas 07–10 do Figma */
export const APP_ROUTES: AppRoute[] = [
  {
    path: "/",
    label: "Início",
    icon: Home,
    title: "Olá! Pronta para florescer? ✨",
    subtitle: "Sua vida acadêmica, um passo de cada vez.",
  },
  {
    path: "/kanban",
    label: "Kanban",
    icon: KanbanSquare,
    title: "Olá! Pronta para florescer? ✨",
    subtitle: "Sua vida acadêmica, um passo de cada vez.",
  },
  {
    path: "/grade",
    label: "Grade horária",
    icon: CalendarDays,
    title: "Olá! Pronta para florescer? ✨",
    subtitle: "Sua vida acadêmica, um passo de cada vez.",
  },
  {
    path: "/disciplinas",
    label: "Disciplinas",
    icon: BookOpen,
    title: "Olá! Pronta para florescer? ✨",
    subtitle: "Sua vida acadêmica, um passo de cada vez.",
  },
  {
    path: "/lembretes",
    label: "Lembretes",
    icon: Bell,
    title: "Olá! Pronta para florescer? ✨",
    subtitle: "Sua vida acadêmica, um passo de cada vez.",
  },
  {
    path: "/notas",
    label: "Notas e frequência",
    icon: GraduationCap,
    title: "Notas e frequência",
    subtitle: "Acompanhe seu progresso com tranquilidade.",
  },
  {
    path: "/calendario",
    label: "Calendário",
    icon: CalendarRange,
    title: "Calendário acadêmico",
    subtitle: "Todas as datas importantes do semestre.",
  },
  {
    path: "/revisao",
    label: "Revisão e flashcards",
    icon: Brain,
    title: "Revisão inteligente",
    subtitle: "Um pouco por dia faz toda a diferença.",
  },
  {
    path: "/laboratorio",
    label: "Editor de código",
    icon: Code2,
    title: "Laboratório de estudos",
    subtitle: "Seu espaço para programar e escrever matemática.",
  },
];
