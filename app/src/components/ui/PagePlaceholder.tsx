import type { ReactNode } from "react";

type PagePlaceholderProps = {
  screen: string;
  children?: ReactNode;
};

export function PagePlaceholder({ screen, children }: PagePlaceholderProps) {
  return (
    <section className="rounded-2xl border border-bloom-200/80 bg-surface p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-bloom-500">
        {screen}
      </p>
      <p className="mt-2 text-sm text-muted">
        Shell pronta. A UI fiel ao Figma entra no próximo passo.
      </p>
      {children ? <div className="mt-4">{children}</div> : null}
    </section>
  );
}
