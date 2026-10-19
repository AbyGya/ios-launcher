import { create } from "zustand";
import { bridge, isLauncher, parseApps, parseStatus, type NativeAppInfo, type NativeStatus } from "../native/bridge";

const DOCK_MATCHERS: string[][] = [
  ["dialer", "contacts", "phone"],
  ["messaging", "mms", "sms"],
  ["chrome", "browser", "firefox"],
  ["camera", "gcam"],
];

function pickDock(apps: NativeAppInfo[]): string[] {
  const used = new Set<string>();
  const dock: string[] = [];
  for (const matchers of DOCK_MATCHERS) {
    const found = apps.find(
      (a) => !used.has(a.pkg) && matchers.some((m) => a.pkg.toLowerCase().includes(m)),
    );
    if (found) {
      used.add(found.pkg);
      dock.push(found.pkg);
    }
  }
  for (const a of apps) {
    if (dock.length >= 4) break;
    if (!used.has(a.pkg)) {
      used.add(a.pkg);
      dock.push(a.pkg);
    }
  }
  return dock;
}

function loadHidden(): string[] {
  try {
    return JSON.parse(localStorage.getItem("launcher-hidden") ?? "[]") as string[];
  } catch {
    return [];
  }
}

interface LauncherState {
  ready: boolean;
  isDefault: boolean;
  apps: NativeAppInfo[];
  dock: string[];
  hidden: string[];
  status: NativeStatus | null;
  bannerDismissed: boolean;
  iconCache: Record<string, string>;
  pendingIcons: Record<string, Promise<string>>;
  init(): Promise<void>;
  refreshStatus(): Promise<void>;
  setStatus(s: NativeStatus): void;
  loadIcon(pkg: string): Promise<string>;
  launch(pkg: string): Promise<boolean>;
  hide(pkg: string): void;
  dismissBanner(): void;
}

export const useLauncher = create<LauncherState>((set, get) => ({
  ready: !isLauncher,
  isDefault: true,
  apps: [],
  dock: [],
  hidden: loadHidden(),
  status: null,
  bannerDismissed: false,
  iconCache: {},
  pendingIcons: {},

  async init() {
    if (!isLauncher || !bridge) return;
    const apps = parseApps(bridge.getApps()).sort((a, b) =>
      a.label.localeCompare(b.label, "id", { sensitivity: "base" }),
    );
    set({
      ready: true,
      apps,
      dock: pickDock(apps),
      isDefault: bridge.isDefault(),
      status: parseStatus(bridge.getStatus()),
    });
  },

  async refreshStatus() {
    if (!isLauncher || !bridge) return;
    const s = parseStatus(bridge.getStatus());
    if (s) set({ status: s });
  },

  setStatus(s) {
    set({ status: s });
  },

  async loadIcon(pkg) {
    const cached = get().iconCache[pkg];
    if (cached) return cached;
    const pending = get().pendingIcons[pkg];
    if (pending) return pending;
    const b = bridge;
    if (!b) return "";
    const job = Promise.resolve()
      .then(() => b.getIcon(pkg))
      .catch(() => "")
      .then((uri) => {
        if (uri) set((s) => ({ iconCache: { ...s.iconCache, [pkg]: uri } }));
        return uri;
      });
    set((s) => ({ pendingIcons: { ...s.pendingIcons, [pkg]: job } }));
    return job;
  },

  async launch(pkg) {
    const b = bridge;
    if (!b) return false;
    const ok = await Promise.resolve()
      .then(() => b.launch(pkg))
      .catch(() => false);
    if (ok) set({ isDefault: b.isDefault() });
    return !!ok;
  },

  hide(pkg) {
    const next = [...new Set([...get().hidden, pkg])];
    try {
      localStorage.setItem("launcher-hidden", JSON.stringify(next));
    } catch {
      void 0;
    }
    set({ hidden: next });
  },

  dismissBanner() {
    set({ bannerDismissed: true });
  },
}));
