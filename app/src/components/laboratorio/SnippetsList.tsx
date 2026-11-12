import { Trash2 } from "lucide-react";
import { PASTEL_BG } from "../../lib/colors";
import { cn } from "../../lib/utils";

type SnippetItem = {
  id: string;
  name: string;
  icon: string;
  tint: "lavender" | "pink" | "mint";
  language?: string;
};

type SnippetsListProps = {
  items: SnippetItem[];
  activeId?: string | null;
  onSelect?: (id: string) => void;
  onDelete?: (id: string) => void;
};

export function SnippetsList({
  items,
  activeId,
  onSelect,
  onDelete,
}: SnippetsListProps) {
  return (
    <section className="rounded-2xl border border-bloom-100 bg-surface p-5 shadow-sm">
      <h3 className="mb-4 text-base font-bold text-ink">Arquivos e snippets</h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted">
          Nenhum arquivo nesta disciplina. Crie um com “Novo arquivo”.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => {
            const active = item.id === activeId;
            return (
              <li key={item.id} className="flex items-stretch gap-1.5">
                <button
                  type="button"
                  onClick={() => onSelect?.(item.id)}
                  className={cn(
                    "flex min-w-0 flex-1 items-center gap-3 rounded-xl px-3.5 py-3 text-left transition",
                    PASTEL_BG[item.tint],
                    active && "ring-2 ring-bloom-500 ring-offset-1",
                  )}
                >
                  <span className="text-base font-bold text-ink/70">
                    {item.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink">
                      {item.name}
                    </span>
                    {item.language ? (
                      <span className="text-[11px] font-medium text-muted">
                        {item.language}
                      </span>
                    ) : null}
                  </span>
                </button>
                {onDelete ? (
                  <button
                    type="button"
                    onClick={() => onDelete(item.id)}
                    className="inline-flex h-auto min-h-11 shrink-0 items-center justify-center rounded-xl px-2.5 text-muted hover:bg-rose-50 hover:text-rose-600"
                    aria-label={`Excluir ${item.name}`}
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
