export interface NativeStatus {
  time: number;
  battery: number;
  charging: boolean;
  wifi: boolean;
  cellular: boolean;
  airplane: boolean;
}

export interface NativeInsets {
  top: number;
  bottom: number;
  scale: number;
}

export interface NativeAppInfo {
  id: string;
  pkg: string;
  label: string;
  system: boolean;
}

interface BridgeApi {
  getApps(): string;
  getIcon(pkg: string): string;
  launch(pkg: string): boolean;
  getStatus(): string;
  getInsets(): string;
  isDefault(): boolean;
  openHomeSettings(): void;
  openAppInfo(pkg: string): void;
  uninstall(pkg: string): void;
  vibrate(ms: number): void;
  openUrl(url: string): void;
  version(): string;
}

declare global {
  interface Window {
    NativeBridge?: BridgeApi;
    __nativeStatus?: (json: string) => void;
    __nativeApps?: (json: string) => void;
  }
}

const raw = typeof window !== "undefined" ? window.NativeBridge ?? null : null;
const wantsMock = typeof location !== "undefined" && new URLSearchParams(location.search).has("mock");

export const isLauncher = !!raw || wantsMock;
export const isMock = !raw && wantsMock;

const MOCK_APPS: [string, string, number][] = [
  ["WhatsApp", "com.whatsapp", 140],
  ["Instagram", "com.instagram.android", 330],
  ["TikTok", "com.zhiliaoapp.musically", 190],
  ["YouTube", "com.google.android.youtube", 0],
  ["Chrome", "com.android.chrome", 210],
  ["Gmail", "com.google.android.gm", 5],
  ["Google Maps", "com.google.android.apps.maps", 130],
  ["Spotify", "com.spotify.music", 120],
  ["Gojek", "com.gojek.app", 90],
  ["Grab", "com.grabtaxi.passenger", 150],
  ["Shopee", "com.shopee.id", 20],
  ["Tokopedia", "com.tokopedia.tkpd", 40],
  ["Telegram", "org.telegram.messenger", 200],
  ["Discord", "com.discord", 235],
  ["Netflix", "com.netflix.mediaclient", 355],
  ["CapCut", "com.lemon.lvoverseas", 260],
  ["Free Fire", "com.dts.freefireth", 25],
  ["Mobile Legends", "com.mobile.legends", 220],
  ["DANA", "id.dana", 215],
  ["OVO", "ovo.id", 250],
  ["BRImo", "id.co.bri.brimo", 205],
  ["MyTelkomsel", "com.telkomsel.telkomselcm", 350],
  ["Drive", "com.google.android.apps.docs", 45],
  ["Photos", "com.google.android.apps.photos", 300],
  ["Facebook", "com.facebook.katana", 220],
  ["Threads", "com.instagram.barcelona", 0],
  ["Zoom", "us.zoom.videomeetings", 210],
  ["WPS Office", "cn.wps.moffice_eng", 10],
  ["Snack Video", "com.kwai.bulldog", 30],
  ["X", "com.twitter.android", 0],
  ["Google", "com.google.android.googlequicksearchbox", 210],
  ["WhatsApp Business", "com.whatsapp.w4b", 150],
  ["Contacts", "com.google.android.contacts", 215],
  ["Phone", "com.google.android.dialer", 130],
  ["Messages", "com.google.android.apps.messaging", 145],
  ["Camera", "com.google.android.GoogleCamera", 240],
];

function mockIcon(label: string, hue: number): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='hsl(${hue} 72% 58%)'/><stop offset='1' stop-color='hsl(${hue} 66% 44%)'/></linearGradient></defs><rect width='128' height='128' rx='30' fill='url(#g)'/><text x='64' y='86' font-family='Inter,Arial,sans-serif' font-size='56' font-weight='700' fill='white' text-anchor='middle'>${label[0].toUpperCase()}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const mockIcons = new Map<string, string>();

const mock: BridgeApi = {
  getApps() {
    return JSON.stringify(
      MOCK_APPS.map(([label, pkg]) => ({ id: pkg, pkg, label, system: false })),
    );
  },
  getIcon(pkg) {
    if (!mockIcons.has(pkg)) {
      const hit = MOCK_APPS.find(([, p]) => p === pkg);
      mockIcons.set(pkg, mockIcon(hit ? hit[0] : "A", hit ? hit[2] : 210));
    }
    return mockIcons.get(pkg) ?? "";
  },
  launch() {
    return true;
  },
  getStatus() {
    return JSON.stringify({
      time: Date.now(),
      battery: 87,
      charging: true,
      wifi: true,
      cellular: true,
      airplane: false,
    });
  },
  getInsets() {
    return JSON.stringify({ top: 0, bottom: 0, scale: 1 });
  },
  isDefault() {
    return false;
  },
  openHomeSettings() {
    void 0;
  },
  openAppInfo() {
    void 0;
  },
  uninstall() {
    void 0;
  },
  vibrate(ms) {
    navigator.vibrate?.(ms);
  },
  openUrl(url) {
    window.open(url, "_blank", "noopener");
  },
  version() {
    return "mock";
  },
};

export const bridge: BridgeApi | null = raw ?? (wantsMock ? mock : null);

export function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export function parseApps(json: string): NativeAppInfo[] {
  try {
    const list = JSON.parse(json) as NativeAppInfo[];
    return list.filter((a) => a && a.pkg && a.label);
  } catch {
    return [];
  }
}

export function parseStatus(json: string): NativeStatus | null {
  try {
    const s = JSON.parse(json) as NativeStatus;
    if (typeof s.battery !== "number") return null;
    return s;
  } catch {
    return null;
  }
}
