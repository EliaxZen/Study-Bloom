import { PASTEL_BG } from "../../lib/colors";
import { cn } from "../../lib/utils";

type SnippetItem = {
  id: string;
  name: string;
  icon: string;
  tint: "lavender" | "pink" | "mint";
};

type SnippetsListProps = {
  items: SnippetItem[];
  onSelect?: (id: string) => void;
};

export function SnippetsList({ items, onSelect }: SnippetsListProps) {
  return (
    <section className="rounded-2xl border border-bloom-100 bg-surface p-5 shadow-sm">
      <h3 className="mb-4 text-base font-bold text-ink">Arquivos e snippets</h3>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onSelect?.(item.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left",
                PASTEL_BG[item.tint],
              )}
            >
              <span className="text-base font-bold text-ink/70">
                {item.icon}
              </span>
              <span className="text-sm font-semibold text-ink">{item.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
