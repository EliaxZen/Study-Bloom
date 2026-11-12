import { useEffect, useState } from "react";
import { FormField as Field } from "./FormField";
import { formControlClassName } from "./formStyles";
import { SimpleModal } from "./SimpleModal";
import { cn } from "../../lib/utils";

export type FormFieldOption = {
  value: string;
  label: string;
};

export type FormFieldType =
  | "text"
  | "textarea"
  | "number"
  | "date"
  | "datetime-local"
  | "select"
  | "email"
  | "password";

/** Descrição declarativa de um campo — páginas de domínio só montam o array. */
export type FormModalField = {
  name: string;
  label: string;
  type?: FormFieldType;
  placeholder?: string;
  required?: boolean;
  options?: FormFieldOption[];
  defaultValue?: string;
  min?: number | string;
  max?: number | string;
  step?: number | string;
  rows?: number;
};

/** @deprecated Use FormModalField — mantido para imports existentes */
export type FormField = FormModalField;

export type FormValues = Record<string, string>;

export type FormModalProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  fields: FormModalField[];
  /** Recebe valores do formulário. Pode ser async (service). */
  onSave?: (values: FormValues) => void | Promise<void>;
  /** Alias de onSave */
  onSubmit?: (values: FormValues) => void | Promise<void>;
  saveLabel?: string;
  submitLabel?: string;
  cancelLabel?: string;
  /** Sobrescreve defaults dos fields quando o modal abre. */
  initialValues?: FormValues;
};

function buildDefaults(
  fields: FormModalField[],
  initialValues?: FormValues,
): FormValues {
  const next: FormValues = {};
  for (const field of fields) {
    next[field.name] =
      initialValues?.[field.name] ??
      field.defaultValue ??
      field.options?.[0]?.value ??
      "";
  }
  return next;
}

function validateRequired(
  fields: FormModalField[],
  values: FormValues,
): string | null {
  for (const field of fields) {
    if (!field.required) continue;
    if (!values[field.name]?.trim()) {
      return `Preencha o campo “${field.label}”.`;
    }
  }
  return null;
}

/**
 * Modal de formulário reutilizável.
 * Domínio passa `fields` + `onSave` (service); o modal cuida de UX de save.
 */
export function FormModal({
  open,
  title,
  description,
  onClose,
  fields,
  onSave,
  onSubmit,
  saveLabel,
  submitLabel,
  cancelLabel,
  initialValues,
}: FormModalProps) {
  const [values, setValues] = useState<FormValues>(() =>
    buildDefaults(fields, initialValues),
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setValues(buildDefaults(fields, initialValues));
    setFieldErrors({});
  }, [open, fields, initialValues]);

  const setField = (name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const saveHandler = onSave ?? onSubmit;

  return (
    <SimpleModal
      open={open}
      title={title}
      description={description}
      onClose={onClose}
      saveLabel={saveLabel ?? submitLabel}
      cancelLabel={cancelLabel}
      validate={() => {
        const err = validateRequired(fields, values);
        if (!err) {
          setFieldErrors({});
          return null;
        }
        const next: Record<string, string> = {};
        for (const field of fields) {
          if (field.required && !values[field.name]?.trim()) {
            next[field.name] = "Obrigatório";
          }
        }
        setFieldErrors(next);
        return err;
      }}
      onSave={async () => {
        if (!saveHandler) return;
        await saveHandler(values);
      }}
    >
      <div className="space-y-3">
        {fields.map((field) => {
          const type = field.type ?? "text";
          const label = `${field.label}${field.required ? " *" : ""}`;
          const error = fieldErrors[field.name] ?? null;
          const controlClass = cn(formControlClassName);

          if (type === "textarea") {
            return (
              <Field key={field.name} label={label} error={error}>
                <textarea
                  name={field.name}
                  rows={field.rows ?? 3}
                  placeholder={field.placeholder}
                  value={values[field.name] ?? ""}
                  onChange={(e) => setField(field.name, e.target.value)}
                  className={cn(controlClass, "resize-none")}
                />
              </Field>
            );
          }

          if (type === "select") {
            return (
              <Field key={field.name} label={label} error={error}>
                <select
                  name={field.name}
                  value={values[field.name] ?? ""}
                  onChange={(e) => setField(field.name, e.target.value)}
                  className={controlClass}
                >
                  {(field.options ?? []).map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </Field>
            );
          }

          return (
            <Field key={field.name} label={label} error={error}>
              <input
                name={field.name}
                type={type}
                placeholder={field.placeholder}
                value={values[field.name] ?? ""}
                min={field.min}
                max={field.max}
                step={field.step}
                onChange={(e) => setField(field.name, e.target.value)}
                className={controlClass}
              />
            </Field>
          );
        })}
      </div>
    </SimpleModal>
  );
}
