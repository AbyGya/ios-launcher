import { create } from "zustand";
import type { NotifItem } from "../types";

interface NotifState {
  items: NotifItem[];
  unread: Record<string, number>;
  push: (n: Omit<NotifItem, "id" | "time"> & { time?: number }) => void;
  dismiss: (id: string) => void;
  clear: () => void;
  clearApp: (app: string) => void;
}

export const useNotifications = create<NotifState>((set) => ({
  items: [],
  unread: {},
  push: (n) =>
    set((s) => ({
      items: [
        {
          ...n,
          id: `n-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
          time: n.time ?? Date.now(),
        },
        ...s.items,
      ].slice(0, 40),
      unread: { ...s.unread, [n.app]: (s.unread[n.app] ?? 0) + 1 },
    })),
  dismiss: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
  clear: () => set({ items: [], unread: {} }),
  clearApp: (app) =>
    set((s) => {
      const unread = { ...s.unread };
      delete unread[app];
      return { items: s.items.filter((i) => i.app !== app), unread };
    }),
}));
