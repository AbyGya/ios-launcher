import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSystem } from "../store/system";
import { useSettings } from "../store/settings";
import { generateWallpaper } from "../lib/wallpaper";
import { Sfx } from "../lib/sfx";
import { Haptics } from "../lib/haptics";
import { clamp, cn } from "../lib/util";
import { AppIconArt } from "../icons/AppIcons";
import { Magnifier, Xmark } from "../icons/Sys";
import { showAlert } from "../components/ui/surfaces";
import { useT } from "../i18n";
import { useClock } from "../system/StatusBar";
import type { AppId } from "../types";
import { APPS } from "../apps/registry";
import { useLauncher } from "../store/launcher";
import { isLauncher, bridge } from "../native/bridge";
import type { NativeAppInfo } from "../native/bridge";
import { NativeIcon } from "../components/NativeIcon";

export const DOCK_APPS: AppId[] = ["phone", "safari", "messages", "music"];
export const HOME_GRID: (AppId | "folder")[] = [
  "facetime",
  "calendar",
  "photos",
  "camera",
  "mail",
  "notes",
  "reminders",
  "clock",
  "maps",
  "weather",
  "wallet",
  "health",
  "settings",
  "appstore",
  "files",
  "folder",
];

const LIBRARY: { title: string; titleEn: string; apps: AppId[] }[] = [
  {
    title: "Utilitas",
    titleEn: "Utilities",
    apps: ["calculator", "voicememos", "files", "settings"],
  },
  {
    title: "Produktivitas",
    titleEn: "Productivity",
    apps: ["notes", "reminders", "calendar", "mail"],
  },
  {
    title: "Hiburan",
    titleEn: "Entertainment",
    apps: ["music", "appstore", "photos", "camera"],
  },
  {
    title: "Info & Lainnya",
    titleEn: "Information & Others",
    apps: ["weather", "maps", "wallet", "health", "clock", "facetime", "phone", "messages", "safari"],
  },
];

function WidgetClock() {
  const now = useClock(1000);
  const h = (now.getHours() % 12) + now.getMinutes() / 60;
  const m = now.getMinutes();
  const s = now.getSeconds();
  return (
    <div
      className="widget glass"
      style={{ width: 172, height: 172, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(20,20,24,0.5)" }}
      onClick={() => {
        useSystem.getState().launchApp("clock");
      }}
    >
      <svg width="128" height="128" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="47" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" />
        {Array.from({ length: 12 }).map((_, i) => {
          const a = ((i / 12) * 360 - 90) * (Math.PI / 180);
          return (
            <line
              key={i}
              x1={50 + Math.cos(a) * 38}
              y1={50 + Math.sin(a) * 38}
              x2={50 + Math.cos(a) * 43}
              y2={50 + Math.sin(a) * 43}
              stroke="#fff"
              strokeWidth={i % 3 === 0 ? 3.4 : 1.6}
              strokeLinecap="round"
            />
          );
        })}
        <line x1="50" y1="50" x2={50 + Math.sin((h / 12) * Math.PI * 2) * 22} y2={50 - Math.cos((h / 12) * Math.PI * 2) * 22} stroke="#fff" strokeWidth="4.4" strokeLinecap="round" />
        <line x1="50" y1="50" x2={50 + Math.sin((m / 60) * Math.PI * 2) * 31} y2={50 - Math.cos((m / 60) * Math.PI * 2) * 31} stroke="#fff" strokeWidth="3.4" strokeLinecap="round" />
        <line x1="50" y1="50" x2={50 + Math.sin((s / 60) * Math.PI * 2) * 34} y2={50 - Math.cos((s / 60) * Math.PI * 2) * 34} stroke="#ff9f0a" strokeWidth="2" strokeLinecap="round" />
        <circle cx="50" cy="50" r="3" fill="#ff9f0a" />
      </svg>
      <div style={{ position: "absolute", bottom: 14, fontSize: 13, fontWeight: 600, opacity: 0.85, fontVariantNumeric: "tabular-nums" }}>
        {String(now.getHours()).padStart(2, "0")}:{String(now.getMinutes()).padStart(2, "0")}
      </div>
    </div>
  );
}

function WidgetWeather({ large }: { large?: boolean }) {
  const t = useT();
  const hours = Array.from({ length: 6 }).map((_, i) => {
    const h = new Date(Date.now() + i * 3600_000).getHours();
    return { h, temp: 30 - Math.round(Math.abs(15 - h) / 2.4) };
  });
  return (
    <div
      className="widget"
      onClick={() => useSystem.getState().launchApp("weather")}
      style={{
        width: large ? 372 : 172,
        height: large ? 176 : 172,
        background: "linear-gradient(160deg, #1f6fd8 0%, #2f9bff 45%, #57c1ff 100%)",
        padding: 16,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        color: "#fff",
        boxShadow: "inset 0 0.5px 0 rgba(255,255,255,0.4)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Jakarta</div>
          <div style={{ fontSize: large ? 42 : 30, fontWeight: 300, letterSpacing: -1, lineHeight: 1.1 }}>31°</div>
          <div style={{ fontSize: 13, opacity: 0.85 }}>{t("common.now")} · Cerah Berawan</div>
        </div>
        <div style={{ fontSize: large ? 34 : 26 }}>⛅</div>
      </div>
      {large && (
        <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, borderTop: "0.5px solid rgba(255,255,255,0.35)" }}>
          {hours.map((h) => (
            <div key={h.h} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, fontSize: 12.5, fontWeight: 600 }}>
              <span style={{ opacity: 0.85 }}>{String(h.h).padStart(2, "0")}</span>
              <span style={{ fontSize: 15 }}>⛅</span>
              <span>{h.temp}°</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WidgetCalendar() {
  const t = useT();
  const now = new Date();
  const events = [
    { time: "09.00", title: "Standup Produk" },
    { time: "13.30", title: "Makan siang tim" },
    { time: "19.00", title: "Gym" },
  ];
  return (
    <div
      className="widget"
      onClick={() => useSystem.getState().launchApp("calendar")}
      style={{ width: 372, height: 150, background: "rgba(28,28,32,0.55)", backdropFilter: "blur(24px)", padding: 15, color: "#fff" }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, color: "#ff453a" }}>
        {t(`time.days.${now.getDay()}`).toUpperCase()}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
        {events.map((e) => (
          <div key={e.title} style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ width: 3, height: 16, borderRadius: 2, background: "#ff453a" }} />
            <span style={{ fontSize: 12.5, opacity: 0.7, width: 42, fontVariantNumeric: "tabular-nums" }}>{e.time}</span>
            <span style={{ fontSize: 13.5, fontWeight: 600 }}>{e.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function WidgetBattery() {
  const battery = useSystem((s) => s.batteryLevel);
  const charging = useSystem((s) => s.charging);
  const r = 34;
  const circ = 2 * Math.PI * r;
  return (
    <div
      className="widget glass"
      onClick={() => useSystem.getState().launchApp("settings")}
      style={{ width: 172, height: 172, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 6, background: "rgba(20,20,24,0.5)" }}
    >
      <svg width="104" height="104" viewBox="0 0 84 84">
        <circle cx="42" cy="42" r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="7" />
        <circle
          cx="42"
          cy="42"
          r={r}
          fill="none"
          stroke={battery <= 20 ? "#ff453a" : charging ? "#30d158" : "#fff"}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - battery / 100)}
          transform="rotate(-90 42 42)"
        />
        <text x="42" y="47" textAnchor="middle" fill="#fff" fontSize="19" fontWeight="700" fontFamily="Inter,sans-serif">
          {battery}%
        </text>
      </svg>
      <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.8 }}>{charging ? "Mengisi daya ⚡" : "Baterai"}</div>
    </div>
  );
}

function HomeIcon({
  id,
  edit,
  onRemove,
  onDrag,
  onOpenFolder,
  labelOverride,
}: {
  id: AppId | "folder";
  edit: boolean;
  onRemove?: () => void;
  onDrag?: (dx: number, dy: number, done: boolean) => void;
  onOpenFolder?: () => void;
  labelOverride?: string;
}) {
  const t = useT();
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const moved = useRef(false);
  const timer = useRef<number | null>(null);

  return (
    <motion.div
      layout={!dragStart.current}
      style={{ width: 78, display: "flex", flexDirection: "column", alignItems: "center", gap: 5, position: "relative" }}
      onPointerDown={(e) => {
        if (edit && onDrag) {
          dragStart.current = { x: e.clientX, y: e.clientY };
          moved.current = false;
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        }
      }}
      onPointerMove={(e) => {
        if (!dragStart.current || !onDrag) return;
        const dx = e.clientX - dragStart.current.x;
        const dy = e.clientY - dragStart.current.y;
        if (Math.abs(dx) > 6 || Math.abs(dy) > 6) moved.current = true;
        onDrag(dx, dy, false);
      }}
      onPointerUp={(e) => {
        if (dragStart.current && onDrag) {
          const dx = e.clientX - dragStart.current.x;
          const dy = e.clientY - dragStart.current.y;
          dragStart.current = null;
          onDrag(dx, dy, true);
        }
      }}
    >
      <motion.div
        layoutId={edit || id === "folder" ? undefined : `app-${id}`}
        className={edit ? "jiggle" : undefined}
        style={{ position: "relative", cursor: edit ? "grab" : "pointer" }}
        onClick={() => {
          if (edit || moved.current) {
            moved.current = false;
            return;
          }
          Haptics.medium();
          Sfx.click();
          if (id === "folder") {
            onOpenFolder?.();
            return;
          }
          useSystem.getState().launchApp(id);
        }}
      >
        <AppIconArt id={id} size={64} />
        {edit && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove?.();
            }}
            style={{
              position: "absolute",
              top: -5,
              left: -5,
              width: 21,
              height: 21,
              borderRadius: "50%",
              background: "rgba(40,40,44,0.92)",
              border: "1px solid rgba(255,255,255,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 5,
              boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
            }}
          >
            <Xmark size={10} color="#fff" strokeWidth={3} />
          </button>
        )}
      </motion.div>
      <span style={{ fontSize: 11.5, fontWeight: 500, color: "#fff", textShadow: "0 1px 6px rgba(0,0,0,0.55)", whiteSpace: "nowrap", maxWidth: 76, overflow: "hidden", textOverflow: "ellipsis" }}>
        {labelOverride ?? (id === "folder" ? t("app.utilities") : t(`app.${id}`))}
      </span>
    </motion.div>
  );
}

function FolderOverlay({ title, apps, onClose }: { title: string; apps: AppId[]; onClose: () => void }) {
  const t = useT();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "absolute", inset: 0, zIndex: 130, background: "rgba(0,0,0,0.28)", backdropFilter: "blur(38px) saturate(140%)", WebkitBackdropFilter: "blur(38px) saturate(140%)", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 170 }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, width: "100%", maxHeight: "72%" }}>
        <div className="scroll-y" style={{ width: "100%", padding: "0 36px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24, justifyItems: "center" }}>
            {apps.map((id) => (
              <div
                key={id}
                onClick={() => {
                  Haptics.medium();
                  Sfx.click();
                  onClose();
                  useSystem.getState().launchApp(id);
                }}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: 76, cursor: "pointer" }}
              >
                <AppIconArt id={id} size={64} />
                <span style={{ fontSize: 11.5, color: "#fff", fontWeight: 500, whiteSpace: "nowrap" }}>{t(`app.${id}`)}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ fontSize: 32, fontWeight: 700, color: "#fff", marginTop: 8, textShadow: "0 2px 16px rgba(0,0,0,0.4)" }}>
          {title}
        </div>
      </div>
    </motion.div>
  );
}

function RealHomeIcon({ app, edit, onHide }: { app: NativeAppInfo; edit: boolean; onHide: (app: NativeAppInfo) => void }) {
  const t = useT();
  const timer = useRef<number | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const moved = useRef(false);

  const cancelPress = () => {
    if (timer.current) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    start.current = null;
  };

  const openMenu = () => {
    Haptics.heavy();
    Sfx.whoosh(false);
    void showAlert({
      title: app.label,
      buttons: [t("launcher.appInfo"), t("launcher.uninstall"), t("common.cancel")],
      cancelIndex: 2,
    }).then((res) => {
      if (res === 0) bridge?.openAppInfo(app.pkg);
      else if (res === 1) bridge?.uninstall(app.pkg);
    });
  };

  const open = () => {
    Haptics.medium();
    Sfx.click();
    useLauncher.getState().launch(app.pkg).then((ok) => {
      if (!ok) {
        void showAlert({ title: t("launcher.failed"), buttons: [t("common.ok")] });
      }
    });
  };

  return (
    <motion.div
      layout={!start.current}
      style={{ width: 78, display: "flex", flexDirection: "column", alignItems: "center", gap: 5, position: "relative" }}
      onPointerDown={(e) => {
        if (edit) return;
        start.current = { x: e.clientX, y: e.clientY };
        moved.current = false;
        timer.current = window.setTimeout(() => {
          timer.current = null;
          openMenu();
        }, 560);
      }}
      onPointerMove={(e) => {
        if (!start.current) return;
        if (Math.abs(e.clientX - start.current.x) > 7 || Math.abs(e.clientY - start.current.y) > 7) {
          moved.current = true;
          cancelPress();
        }
      }}
      onPointerUp={cancelPress}
      onPointerLeave={cancelPress}
      onPointerCancel={cancelPress}
      onContextMenu={(e) => e.preventDefault()}
    >
      <motion.div
        className={edit ? "jiggle" : undefined}
        style={{ position: "relative", cursor: edit ? "grab" : "pointer" }}
        onClick={() => {
          if (edit || moved.current) {
            moved.current = false;
            return;
          }
          open();
        }}
      >
        <NativeIcon pkg={app.pkg} label={app.label} size={64} />
        {edit && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onHide(app);
            }}
            style={{
              position: "absolute",
              top: -5,
              left: -5,
              width: 21,
              height: 21,
              borderRadius: "50%",
              background: "rgba(40,40,44,0.92)",
              border: "1px solid rgba(255,255,255,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 5,
              boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
            }}
          >
            <Xmark size={10} color="#fff" strokeWidth={3} />
          </button>
        )}
      </motion.div>
      <span style={{ fontSize: 11.5, fontWeight: 500, color: "#fff", textShadow: "0 1px 6px rgba(0,0,0,0.55)", whiteSpace: "nowrap", maxWidth: 76, overflow: "hidden", textOverflow: "ellipsis" }}>
        {app.label}
      </span>
    </motion.div>
  );
}

function LauncherLibrary({ apps }: { apps: NativeAppInfo[] }) {
  const groups = useMemo(() => {
    const map = new Map<string, NativeAppInfo[]>();
    for (const a of apps) {
      const key = (a.label[0] ?? "#").toUpperCase();
      const list = map.get(key) ?? [];
      list.push(a);
      map.set(key, list);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [apps]);

  return (
    <div className="scroll-y" style={{ width: 440, height: "100%", padding: "80px 26px 140px" }}>
      {groups.map(([letter, list]) => (
        <div key={letter} style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 19, fontWeight: 700, color: "#fff", marginBottom: 12, textShadow: "0 1px 10px rgba(0,0,0,0.4)" }}>
            {letter}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
            {list.map((app) => (
              <div
                key={app.pkg}
                onClick={() => {
                  Haptics.medium();
                  Sfx.click();
                  useLauncher.getState().launch(app.pkg).then((ok) => {
                    if (!ok && isLauncher) void showAlert({ title: useSettings.getState().lang === "id" ? "Tidak dapat membuka aplikasi" : "Couldn't open the app", buttons: ["OK"] });
                  });
                }}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, cursor: "pointer" }}
              >
                <NativeIcon pkg={app.pkg} label={app.label} size={56} />
                <span style={{ fontSize: 10.5, color: "#fff", textShadow: "0 1px 6px rgba(0,0,0,0.5)", maxWidth: 74, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {app.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function AppLibraryPage() {
  const t = useT();
  const lang = useSettings((s) => s.lang);
  return (
    <div className="scroll-y" style={{ width: 440, height: "100%", padding: "80px 26px 140px" }}>
      {LIBRARY.map((section) => (
        <div key={section.title} style={{ marginBottom: 26 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 12, textShadow: "0 1px 10px rgba(0,0,0,0.4)" }}>
            {lang === "id" ? section.title : section.titleEn}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
            {section.apps.map((id) => (
              <div
                key={id}
                onClick={() => {
                  Haptics.medium();
                  Sfx.click();
                  useSystem.getState().launchApp(id);
                }}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, cursor: "pointer" }}
              >
                <AppIconArt id={id} size={56} />
                <span style={{ fontSize: 10.5, color: "#fff", textShadow: "0 1px 6px rgba(0,0,0,0.5)" }}>{t(`app.${id}`)}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function HomeScreen() {
  const t = useT();
  const wallpaper = useSettings((s) => s.wallpaper);
  const customWallpaper = useSettings((s) => s.customWallpaper);
  const jiggle = useSystem((s) => s.jiggle);
  const locked = useSystem((s) => s.locked);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<(AppId | "folder")[]>(HOME_GRID);
  const [folderOpen, setFolderOpen] = useState(false);
  const [drag, setDrag] = useState<{ id: number; dx: number; dy: number } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const longPress = useRef<number | null>(null);
  const bg = customWallpaper ?? generateWallpaper(wallpaper === "custom" ? "cosmic" : wallpaper);
  const launcherReady = useLauncher((s) => s.ready);
  const launcherApps = useLauncher((s) => s.apps);
  const launcherDock = useLauncher((s) => s.dock);
  const launcherHidden = useLauncher((s) => s.hidden);
  const isDefaultLauncher = useLauncher((s) => s.isDefault);
  const bannerDismissed = useLauncher((s) => s.bannerDismissed);
  const visibleApps = useMemo(
    () => launcherApps.filter((a) => !launcherHidden.includes(a.pkg)),
    [launcherApps, launcherHidden],
  );
  const realPages = useMemo(() => {
    if (!isLauncher) return [] as NativeAppInfo[][];
    const first = visibleApps.slice(0, 23);
    const rest = visibleApps.slice(23);
    const pages: NativeAppInfo[][] = [first];
    for (let i = 0; i < rest.length; i += 24) pages.push(rest.slice(i, i + 24));
    return pages;
  }, [visibleApps]);

  useEffect(() => {
    if (!jiggle) setDrag(null);
  }, [jiggle]);

  const totalPages = isLauncher ? 1 + realPages.length + 1 : 3;
  const totalPagesRef = useRef(totalPages);
  totalPagesRef.current = totalPages;

  const goHome = () => {
    useSystem.getState().set({ homePage: 1, jiggle: false });
    setPage(1);
  };
  useEffect(() => {
    const unsub = useSystem.subscribe((s, prev) => {
      if (s.homePage !== prev.homePage && s.homePage >= 0) {
        setPage(clamp(s.homePage, 0, totalPagesRef.current - 1));
      }
    });
    return unsub;
  }, []);

  const onGridPointerDown = () => {
    longPress.current = window.setTimeout(() => {
      Haptics.heavy();
      Sfx.whoosh(false);
      useSystem.setState({ jiggle: true });
    }, 550);
  };
  const cancelLongPress = () => {
    if (longPress.current) window.clearTimeout(longPress.current);
  };

  const removeApp = async (id: AppId | "folder") => {
    const idx = items.indexOf(id);
    if (idx < 0) return;
    const res = await showAlert({
      title: `${t("common.delete")} “${id === "folder" ? t("app.utilities") : t(`app.${id}`)}”?`,
      buttons: [t("common.delete"), t("common.cancel")],
      cancelIndex: 1,
    });
    if (res === 0) {
      Haptics.warning();
      Sfx.tick();
      setItems((prev) => prev.filter((x) => x !== id));
      if (id !== "folder") {
        useSystem.setState((s) => ({
          hiddenApps: [...new Set([...s.hiddenApps, id])],
          installedApps: s.installedApps.filter((a) => a !== id),
        }));
      }
    }
  };

  const openFolder = () => {
    setFolderOpen(true);
  };

  const simApps = useMemo(() => Object.keys(APPS) as AppId[], []);

  const hideReal = (app: NativeAppInfo) => {
    void showAlert({
      title: `${t("launcher.hide")} “${app.label}”?`,
      buttons: [t("launcher.hide"), t("common.cancel")],
      cancelIndex: 1,
    }).then((res) => {
      if (res === 0) {
        Haptics.warning();
        Sfx.tick();
        useLauncher.getState().hide(app.pkg);
      }
    });
  };

  const handleDrag = (index: number, dx: number, dy: number, done: boolean) => {
    if (!done) {
      setDrag({ id: index, dx, dy });
      return;
    }
    setDrag(null);
    const cellW = 440 * 0.9 / 4;
    const cellH = 88;
    const colShift = Math.round(dx / cellW);
    const rowShift = Math.round(dy / cellH);
    const cols = 4;
    const shift = colShift + rowShift * cols;
    if (shift !== 0) {
      setItems((prev) => {
        const next = [...prev];
        const target = clamp(index + shift, 0, next.length - 1);
        const [movedItem] = next.splice(index, 1);
        next.splice(target, 0, movedItem);
        return next;
      });
      Haptics.light();
      Sfx.tick();
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 10,
        opacity: locked ? 0 : 1,
        transform: locked ? "scale(1.05)" : "scale(1)",
        transition: "opacity 0.45s ease, transform 0.45s ease",
        pointerEvents: locked ? "none" : "auto",
      }}
    >
      <div className="wallpaper" style={{ backgroundImage: `url(${bg})` }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.18), rgba(0,0,0,0.05) 30%, rgba(0,0,0,0.32))" }} />

      <motion.div
        drag={jiggle ? false : "x"}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.14}
        onDragEnd={(_, info) => {
          const threshold = 70 + Math.abs(info.velocity.x) * 0.04;
          if (info.offset.x < -threshold) setPage((p) => clamp(p + 1, 0, totalPages - 1));
          else if (info.offset.x > threshold) setPage((p) => clamp(p - 1, 0, totalPages - 1));
        }}
        animate={{ x: -page * 440 }}
        transition={{ type: "spring", stiffness: 300, damping: 32 }}
        style={{ position: "absolute", inset: 0, display: "flex", width: 440 * totalPages }}
      >
        {isLauncher ? (
          <>
            <div style={{ width: 440, height: "100%", paddingTop: 64 }}>
              <div className="scroll-y" style={{ height: "100%", padding: "10px 34px 130px", display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
                <WidgetClock />
                <WidgetWeather large />
                <WidgetBattery />
                <WidgetCalendar />
              </div>
            </div>

            {realPages.map((pageApps, pi) => (
              <div key={pi} style={{ width: 440, height: "100%" }}>
                <div
                  onPointerDown={onGridPointerDown}
                  onPointerUp={cancelLongPress}
                  onPointerLeave={cancelLongPress}
                  onPointerMove={cancelLongPress}
                  style={{ height: "100%", padding: "84px 30px 130px" }}
                >
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", rowGap: 22, columnGap: 12, justifyItems: "center" }}>
                    {pi === 0 && <HomeIcon id="folder" edit={jiggle} onOpenFolder={openFolder} labelOverride="iOS" />}
                    {pageApps.map((app) => (
                      <RealHomeIcon key={app.pkg} app={app} edit={jiggle} onHide={hideReal} />
                    ))}
                  </div>
                </div>
              </div>
            ))}

            <div style={{ width: 440, height: "100%", background: "rgba(10,10,14,0.35)", backdropFilter: "blur(30px)" }}>
              <LauncherLibrary apps={visibleApps} />
            </div>
          </>
        ) : (
          <>
        <div style={{ width: 440, height: "100%", paddingTop: 64 }}>
          <div className="scroll-y" style={{ height: "100%", padding: "10px 34px 130px", display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
            <WidgetClock />
            <WidgetWeather large />
            <WidgetBattery />
            <WidgetCalendar />
          </div>
        </div>

        <div style={{ width: 440, height: "100%" }}>
          <div
            ref={gridRef}
            onPointerDown={onGridPointerDown}
            onPointerUp={cancelLongPress}
            onPointerLeave={cancelLongPress}
            onPointerMove={cancelLongPress}
            style={{
              paddingTop: 62,
              height: "100%",
              padding: "70px 30px 130px",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <div style={{ display: "flex", justifyContent: "center" }}>
              <WidgetWeather />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", rowGap: 22, columnGap: 12, justifyItems: "center", marginTop: 4 }}>
              {items.map((id, i) => (
                <motion.div
                  key={id}
                  animate={drag?.id === i ? { x: drag.dx, y: drag.dy, scale: 1.14, zIndex: 60, opacity: 0.92 } : { x: 0, y: 0, scale: 1, zIndex: 1 }}
                  transition={drag?.id === i ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 38 }}
                  style={{ position: "relative" }}
                >
                  <HomeIcon
                    id={id}
                    edit={jiggle}
                    onRemove={() => removeApp(id)}
                    onDrag={(dx, dy, done) => handleDrag(i, dx, dy, done)}
                    onOpenFolder={openFolder}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ width: 440, height: "100%", background: "rgba(10,10,14,0.35)", backdropFilter: "blur(30px)" }}>
          <AppLibraryPage />
        </div>
          </>
        )}
      </motion.div>

      <div style={{ position: "absolute", bottom: 172, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 8, zIndex: 20 }}>
        {Array.from({ length: totalPages }).map((_, i) => (
          <div
            key={i}
            onClick={() => setPage(i)}
            style={{
              width: i === page ? 18 : 7,
              height: 7,
              borderRadius: 7,
              background: i === page ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.4)",
              transition: "all 0.25s ease",
              cursor: "pointer",
            }}
          />
        ))}
      </div>

      <div className="glass" style={{ position: "absolute", bottom: 36, left: 12, right: 12, height: 74, borderRadius: 36, display: "flex", alignItems: "center", justifyContent: "space-around", zIndex: 20 }}>
        {isLauncher
          ? launcherDock.map((pkg) => {
              const app = launcherApps.find((a) => a.pkg === pkg);
              if (!app) return null;
              return (
                <div
                  key={pkg}
                  onClick={() => {
                    Haptics.medium();
                    Sfx.click();
                    void useLauncher.getState().launch(pkg).then((ok) => {
                      if (!ok) void showAlert({ title: t("launcher.failed"), buttons: [t("common.ok")] });
                    });
                  }}
                  style={{ display: "flex", alignItems: "center", cursor: "pointer", padding: 4 }}
                >
                  <NativeIcon pkg={app.pkg} label={app.label} size={58} />
                </div>
              );
            })
          : DOCK_APPS.map((id) => (
              <div
                key={id}
                onClick={() => {
                  Haptics.medium();
                  Sfx.click();
                  useSystem.getState().launchApp(id);
                }}
                style={{ display: "flex", alignItems: "center", cursor: "pointer", padding: 4 }}
              >
                <AppIconArt id={id} size={58} />
              </div>
            ))}
      </div>

      <AnimatePresence>
        {jiggle && (
          <motion.button
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              Haptics.light();
              Sfx.tick();
              goHome();
            }}
            className="glass glass-strong"
            style={{ position: "absolute", top: 72, right: 16, borderRadius: 999, padding: "8px 18px", fontSize: 15, fontWeight: 700, zIndex: 40 }}
          >
            {t("home.edit")}
          </motion.button>
        )}
      </AnimatePresence>

      <div style={{ position: "absolute", bottom: 124, left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 21, pointerEvents: "none" }}>
        <button
          className="glass"
          onClick={() => useSystem.setState({ spotlight: true })}
          style={{ borderRadius: 999, padding: "8px 17px", display: "flex", alignItems: "center", gap: 6, fontSize: 14.5, color: "rgba(255,255,255,0.92)", pointerEvents: "auto" }}
        >
          <Magnifier size={15} />
          {t("home.searchPlaceholder")}
        </button>
      </div>

      {isLauncher && !isDefaultLauncher && !bannerDismissed && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass glass-strong"
          style={{ position: "absolute", top: 74, left: 16, right: 16, zIndex: 35, borderRadius: 20, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}
        >
          <span style={{ flex: 1, fontSize: 12.5, color: "#fff", lineHeight: 1.35 }}>{t("launcher.defaultBody")}</span>
          <button
            onClick={() => {
              Haptics.light();
              Sfx.tick();
              bridge?.openHomeSettings();
            }}
            style={{ background: "rgba(255,255,255,0.2)", borderRadius: 999, padding: "7px 13px", fontSize: 12.5, fontWeight: 700, color: "#fff", border: "none" }}
          >
            {t("launcher.defaultBtn")}
          </button>
          <button
            onClick={() => useLauncher.getState().dismissBanner()}
            style={{ width: 26, height: 26, borderRadius: 999, background: "rgba(255,255,255,0.14)", border: "none", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <Xmark size={11} color="#fff" strokeWidth={3} />
          </button>
        </motion.div>
      )}

      {isLauncher && !launcherReady && (
        <div style={{ position: "absolute", inset: 0, zIndex: 30, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.85)", fontSize: 15, fontWeight: 600, background: "rgba(0,0,0,0.25)" }}>
          {t("launcher.loading")}
        </div>
      )}

      <AnimatePresence>
        {folderOpen && (
          <FolderOverlay
            title={isLauncher ? "iOS" : t("app.utilities")}
            apps={isLauncher ? simApps : ["calculator", "voicememos"]}
            onClose={() => setFolderOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
