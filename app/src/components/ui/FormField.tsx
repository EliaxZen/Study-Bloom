import { cloneElement, isValidElement, useId } from "react";
import { cn } from "../../lib/utils";

type FormFieldProps = {
  label: string;
  /** Mensagem de erro do campo (opcional; o modal também pode mostrar erro global) */
  error?: string | null;
  hint?: string;
  children: React.ReactNode;
  className?: string;
  /** Liga o label a um input com id explícito; se omitido, gera um id */
  htmlFor?: string;
};

/**
 * Campo de formulário compartilhado (label + controle + erro).
 * Use com `formControlClassName` nos inputs/selects/textareas.
 */
export function FormField({
  label,
  error,
  hint,
  children,
  className,
  htmlFor,
}: FormFieldProps) {
  const autoId = useId();
  const fieldId = htmlFor ?? autoId;
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;

  return (
    <label className={cn("block text-sm", className)} htmlFor={fieldId}>
      <span className="mb-1 block font-medium text-ink">{label}</span>
      {injectFieldAttrs(children, {
        id: fieldId,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": error ? errorId : hint ? hintId : undefined,
      })}
      {hint && !error ? (
        <span id={hintId} className="mt-1 block text-xs text-muted">
          {hint}
        </span>
      ) : null}
      {error ? (
        <span id={errorId} role="alert" className="mt-1 block text-xs text-rose-600">
          {error}
        </span>
      ) : null}
    </label>
  );
}

function injectFieldAttrs(
  children: React.ReactNode,
  attrs: Record<string, unknown>,
): React.ReactNode {
  if (!isValidElement(children)) return children;
  const props = children.props as { className?: string };
  return cloneElement(children, {
    ...attrs,
    className: cn(
      props.className,
      attrs["aria-invalid"] ? "border-rose-300 focus:border-rose-400" : null,
    ),
  } as never);
}
