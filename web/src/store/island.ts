import { create } from "zustand";
import type { Activity, ActivityKind } from "../types";

const PRIORITY: ActivityKind[] = [
  "call",
  "facetime",
  "alarm",
  "timer",
  "recording",
  "music",
  "delivery",
  "message",
  "airdrop",
  "charging",
  "stopwatch",
  "faceid",
];

interface IslandState {
  activities: Activity[];
  expanded: string | null;
  add: (a: Omit<Activity, "id" | "createdAt"> & { id?: string }) => string;
  update: (id: string, patch: Partial<Activity>) => void;
  remove: (id: string) => void;
  removeByKind: (kind: ActivityKind) => void;
  getByKind: (kind: ActivityKind) => Activity | undefined;
  active: () => Activity | undefined;
  expand: (id: string | null) => void;
}

let seq = 1;

export const useIsland = create<IslandState>((set, get) => ({
  activities: [],
  expanded: null,
  add: (a) => {
    const id = a.id ?? `${a.kind}-${Date.now()}-${seq++}`;
    set((s) => ({
      activities: [
        { ...a, id, createdAt: Date.now() } as Activity,
        ...s.activities.filter((x) => x.kind !== a.kind || x.id !== id),
      ],
    }));
    return id;
  },
  update: (id, patch) =>
    set((s) => ({
      activities: s.activities.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    })),
  remove: (id) =>
    set((s) => ({
      activities: s.activities.filter((a) => a.id !== id),
      expanded: s.expanded === id ? null : s.expanded,
    })),
  removeByKind: (kind) =>
    set((s) => ({
      activities: s.activities.filter((a) => a.kind !== kind),
      expanded: null,
    })),
  getByKind: (kind) => get().activities.find((a) => a.kind === kind),
  active: () => {
    const list = get().activities;
    for (const k of PRIORITY) {
      const found = list.find((a) => a.kind === k);
      if (found) return found;
    }
    return undefined;
  },
  expand: (id) => set({ expanded: id }),
}));
