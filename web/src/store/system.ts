import { create } from "zustand";
import type { AppId } from "../types";

export type Orientation = "portrait" | "landscape";

interface SystemState {
  booted: boolean;
  locked: boolean;
  alwaysOn: boolean;
  currentApp: AppId | null;
  recents: AppId[];
  appSwitcher: boolean;
  spotlight: boolean;
  controlCenter: boolean;
  notificationCenter: boolean;
  homePage: number;
  jiggle: boolean;
  wifi: boolean;
  bluetooth: boolean;
  cellular: boolean;
  airplane: boolean;
  focus: boolean;
  rotationLock: boolean;
  flashlight: boolean;
  screenRecord: boolean;
  batteryLevel: number;
  charging: boolean;
  orientation: Orientation;
  hiddenApps: AppId[];
  installedApps: AppId[];
  set: (p: Partial<SystemState>) => void;
  launchApp: (id: AppId) => void;
  closeApp: () => void;
  lockDevice: () => void;
  unlockDevice: () => void;
}

export const useSystem = create<SystemState>((set, get) => ({
  booted: false,
  locked: true,
  alwaysOn: false,
  currentApp: null,
  recents: [],
  appSwitcher: false,
  spotlight: false,
  controlCenter: false,
  notificationCenter: false,
  homePage: 1,
  jiggle: false,
  wifi: true,
  bluetooth: true,
  cellular: true,
  airplane: false,
  focus: false,
  rotationLock: true,
  flashlight: false,
  screenRecord: false,
  batteryLevel: 87,
  charging: false,
  orientation: "portrait",
  hiddenApps: [],
  installedApps: [
    "phone",
    "messages",
    "safari",
    "camera",
    "photos",
    "clock",
    "calculator",
    "settings",
    "notes",
    "reminders",
    "weather",
    "maps",
    "calendar",
    "mail",
    "files",
    "voicememos",
    "wallet",
    "health",
    "appstore",
    "facetime",
    "music",
  ],
  set: (p) => set(p),
  launchApp: (id) => {
    const recents = [id, ...get().recents.filter((a) => a !== id)].slice(0, 8);
    set({
      currentApp: id,
      recents,
      appSwitcher: false,
      spotlight: false,
      controlCenter: false,
      notificationCenter: false,
      jiggle: false,
      homePage: -1,
    });
  },
  closeApp: () => {
    const cur = get().currentApp;
    if (!cur) return;
    document.documentElement.style.setProperty("--statusbar-color", "#fff");
    set({
      currentApp: null,
      appSwitcher: false,
      controlCenter: false,
      notificationCenter: false,
    });
    if (!get().installedApps.includes(cur)) return;
  },
  lockDevice: () =>
    set({
      locked: true,
      currentApp: null,
      appSwitcher: false,
      spotlight: false,
      controlCenter: false,
      notificationCenter: false,
      homePage: -1,
    }),
  unlockDevice: () => set({ locked: false, alwaysOn: false, homePage: 1 }),
}));
