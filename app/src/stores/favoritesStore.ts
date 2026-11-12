import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SubjectColor } from "../types";

export type FavoriteKind = "subject" | "content";

export type FavoriteItem = {
  /** Chave estável: subject:id ou content:subjectId:slug */
  id: string;
  kind: FavoriteKind;
  title: string;
  subtitle?: string;
  path: string;
  icon?: string;
  color?: SubjectColor;
  pinnedAt: number;
};

type FavoritesState = {
  items: FavoriteItem[];
  isFavorite: (id: string) => boolean;
  toggle: (item: Omit<FavoriteItem, "pinnedAt">) => boolean;
  remove: (id: string) => void;
};

export function subjectFavoriteId(subjectId: string) {
  return `subject:${subjectId}`;
}

export function contentFavoriteId(subjectId: string, slug: string) {
  return `content:${subjectId}:${slug}`;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      items: [],
      isFavorite: (id) => get().items.some((item) => item.id === id),
      toggle: (item) => {
        const exists = get().items.some((f) => f.id === item.id);
        if (exists) {
          set({ items: get().items.filter((f) => f.id !== item.id) });
          return false;
        }
        set({
          items: [{ ...item, pinnedAt: Date.now() }, ...get().items],
        });
        return true;
      },
      remove: (id) =>
        set({ items: get().items.filter((item) => item.id !== id) }),
    }),
    {
      name: "study-bloom-favorites",
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
