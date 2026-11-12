type StatusMessageProps = {
  variant?: "loading" | "empty" | "error";
  children: string;
};

const STYLES = {
  loading: "text-muted",
  empty: "text-muted",
  error: "text-rose-600",
} as const;

/** Mensagem leve de loading / vazio / erro — sem card extra */
export function StatusMessage({
  variant = "loading",
  children,
}: StatusMessageProps) {
  return (
    <p
      role={variant === "error" ? "alert" : "status"}
      className={`text-sm ${STYLES[variant]}`}
    >
      {children}
    </p>
  );
}
