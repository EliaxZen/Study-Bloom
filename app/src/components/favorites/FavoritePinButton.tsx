import { motion } from "motion/react";
import { Heart } from "lucide-react";
import {
  pressable,
  pressableReduced,
  useReducedMotionPreference,
} from "../../lib/motion";
import { cn } from "../../lib/utils";
import {
  useFavoritesStore,
  type FavoriteItem,
} from "../../stores/favoritesStore";
import { useToastStore } from "../../stores/toastStore";

type FavoritePinButtonProps = {
  item: Omit<FavoriteItem, "pinnedAt">;
  className?: string;
  size?: "sm" | "md";
};

/** Pin / despin com feedback curto via toast */
export function FavoritePinButton({
  item,
  className,
  size = "md",
}: FavoritePinButtonProps) {
  const reduced = useReducedMotionPreference();
  const press = reduced ? pressableReduced : pressable;
  const active = useFavoritesStore((s) => s.isFavorite(item.id));
  const toggle = useFavoritesStore((s) => s.toggle);
  const showToast = useToastStore((s) => s.show);

  const dim =
    size === "sm"
      ? "h-9 w-9 sm:h-8 sm:w-8"
      : "h-11 w-11 sm:h-10 sm:w-10";

  return (
    <motion.button
      type="button"
      aria-label={active ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      aria-pressed={active}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const nowActive = toggle(item);
        showToast(
          nowActive
            ? `Salvo em Favoritos: ${item.title}`
            : `Removido: ${item.title}`,
        );
      }}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full transition-colors",
        active
          ? "bg-pastel-pink text-bloom-600 shadow-sm"
          : "bg-bloom-50 text-muted hover:bg-pastel-pink/70 hover:text-bloom-600",
        dim,
        className,
      )}
      {...press}
    >
      <Heart
        className={cn("h-4 w-4", active && "fill-current")}
        aria-hidden
      />
    </motion.button>
  );
}
