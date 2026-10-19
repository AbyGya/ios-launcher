import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Lang } from "../i18n";

export type WallpaperId =
  | "cosmic"
  | "dusk"
  | "ocean"
  | "bloom"
  | "mono"
  | "aurora"
  | "custom";

interface SettingsState {
  lang: Lang;
  theme: "light" | "dark" | "auto";
  wallpaper: WallpaperId;
  customWallpaper: string | null;
  deviceColor: "cosmic" | "deepblue" | "silver";
  clockGlass: boolean;
  bootAnimation: boolean;
  demoNotifications: boolean;
  sounds: boolean;
  haptics: boolean;
  trueTone: boolean;
  nightShift: boolean;
  autoBrightness: boolean;
  brightness: number;
  volume: number;
  ringing: number;
  lowPower: boolean;
  deviceName: string;
  set: (p: Partial<SettingsState>) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      lang:
        typeof navigator !== "undefined" &&
        navigator.language.toLowerCase().startsWith("id")
          ? "id"
          : "id",
      theme: "auto",
      wallpaper: "cosmic",
      customWallpaper: null,
      deviceColor: "cosmic",
      clockGlass: true,
      bootAnimation: true,
      demoNotifications: true,
      sounds: true,
      haptics: true,
      trueTone: true,
      nightShift: false,
      autoBrightness: true,
      brightness: 0.85,
      volume: 0.7,
      ringing: 0.8,
      lowPower: false,
      deviceName: "iPhone — Abi",
      set: (p) => set(p),
    }),
    { name: "iphone17-settings" },
  ),
);

export function useDark(): boolean {
  const theme = useSettings((s) => s.theme);
  if (theme === "auto") {
    const h = new Date().getHours();
    return h < 6 || h >= 18;
  }
  return theme === "dark";
}
