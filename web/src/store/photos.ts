import { create } from "zustand";
import { get, set } from "idb-keyval";
import { generatePhoto } from "../lib/wallpaper";

export interface PhotoItem {
  id: string;
  url: string;
  ts: number;
  kind: "photo" | "video";
  favorite?: boolean;
  place?: string;
}

interface PhotosState {
  photos: PhotoItem[];
  loaded: boolean;
  load: () => Promise<void>;
  add: (url: string, kind?: "photo" | "video") => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
}

const KEY = "photos-v1";

export const usePhotos = create<PhotosState>((setState, getState) => ({
  photos: [],
  loaded: false,
  load: async () => {
    if (getState().loaded) return;
    try {
      const stored = (await get<PhotoItem[]>(KEY)) ?? [];
      if (stored.length === 0) {
        const seeds = Array.from({ length: 28 }).map((_, i) => i + 1);
        const photos: PhotoItem[] = seeds.map((s) => ({
          id: `seed-${s}`,
          url: generatePhoto(s),
          ts: Date.now() - s * 5400_000 - Math.random() * 3600_000,
          kind: "photo" as const,
          favorite: s % 7 === 0,
        }));
        await set(KEY, photos);
        setState({ photos, loaded: true });
      } else {
        setState({ photos: stored, loaded: true });
      }
    } catch {
      setState({ loaded: true });
    }
  },
  add: (url, kind = "photo") => {
    const item: PhotoItem = {
      id: `p-${Date.now()}`,
      url,
      ts: Date.now(),
      kind,
    };
    const photos = [item, ...getState().photos];
    setState({ photos });
    void set(KEY, photos);
  },
  remove: (id) => {
    const photos = getState().photos.filter((p) => p.id !== id);
    setState({ photos });
    void set(KEY, photos);
  },
  toggleFavorite: (id) => {
    const photos = getState().photos.map((p) => (p.id === id ? { ...p, favorite: !p.favorite } : p));
    setState({ photos });
    void set(KEY, photos);
  },
}));
