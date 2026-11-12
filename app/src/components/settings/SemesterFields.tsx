/**
 * Campos de semestre/curso — compartilhados entre AppShell (modal) e Configurações.
 * Estado controlado pelo pai; persistência via useSemesterStore.updateSemester.
 */

import { FormField } from "../ui/FormField";
import { formControlClassName } from "../ui/formStyles";
import { cn } from "../../lib/utils";

export type SemesterFieldsValue = {
  label: string;
  course: string;
};

type SemesterFieldsProps = {
  value: SemesterFieldsValue;
  onChange: (next: SemesterFieldsValue) => void;
  /** Erros opcionais por campo */
  errors?: Partial<Record<keyof SemesterFieldsValue, string | null>>;
  className?: string;
  /** Layout em coluna única (modal) ou grade (página de settings) */
  layout?: "stack" | "grid";
  disabled?: boolean;
};

/** Abrevia o nome do curso a partir do valor real (nunca hardcode). */
export function compactCourseName(course: string, max = 16): string {
  const trimmed = course.trim();
  if (trimmed.length <= max) return trimmed;
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length > 1) {
    const first = words[0];
    if (first.length >= 4 && first.length <= max) return first;
  }
  return `${trimmed.slice(0, Math.max(1, max - 1))}…`;
}

export function SemesterFields({
  value,
  onChange,
  errors,
  className,
  layout = "stack",
  disabled,
}: SemesterFieldsProps) {
  return (
    <div
      className={cn(
        layout === "grid" ? "grid gap-3 sm:grid-cols-2" : "space-y-3",
        className,
      )}
    >
      <FormField label="Semestre" error={errors?.label} hint="Ex.: 2025.1">
        <input
          type="text"
          value={value.label}
          disabled={disabled}
          placeholder="2025.1"
          autoComplete="off"
          className={formControlClassName}
          onChange={(e) => onChange({ ...value, label: e.target.value })}
        />
      </FormField>
      <FormField
        label="Curso"
        error={errors?.course}
        hint="Nome do seu curso"
        className={layout === "grid" ? "sm:col-span-2" : undefined}
      >
        <input
          type="text"
          value={value.course}
          disabled={disabled}
          placeholder="Seu curso"
          autoComplete="organization-title"
          className={formControlClassName}
          onChange={(e) => onChange({ ...value, course: e.target.value })}
        />
      </FormField>
    </div>
  );
}
