import { create } from "zustand";
import { TRACKS } from "../lib/tracks";

interface MediaState {
  currentId: string | null;
  playing: boolean;
  position: number;
  shuffle: boolean;
  repeat: "off" | "all" | "one";
  liked: Record<string, boolean>;
  set: (p: Partial<MediaState>) => void;
  track: () => (typeof TRACKS)[number] | null;
}

export const useMedia = create<MediaState>((set, get) => ({
  currentId: null,
  playing: false,
  position: 0,
  shuffle: false,
  repeat: "all",
  liked: {},
  set: (p) => set(p),
  track: () => TRACKS.find((t) => t.id === get().currentId) ?? null,
}));
