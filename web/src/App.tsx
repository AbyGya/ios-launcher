import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DeviceStage } from "./system/DeviceStage";
import { StatusBar } from "./system/StatusBar";
import { DynamicIsland } from "./system/DynamicIsland";
import { ControlCenter } from "./system/ControlCenter";
import { NotificationCenter } from "./system/NotificationCenter";
import { Spotlight } from "./system/Spotlight";
import { AppSwitcher } from "./system/AppSwitcher";
import { LockScreen } from "./screens/LockScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { BootScreen } from "./screens/BootScreen";
import { HomeIndicator } from "./system/HomeIndicator";
import { Gestures } from "./system/Gestures";
import { AlertHost } from "./components/ui/surfaces";
import { useSystem } from "./store/system";
import { useSettings } from "./store/settings";
import { useIsland } from "./store/island";
import { useNotifications } from "./store/notifications";
import { APPS } from "./apps/registry";
import { Sfx, unlockAudio } from "./lib/sfx";
import { useDark } from "./store/settings";
import { isLauncher, parseStatus, type NativeStatus } from "./native/bridge";
import { useLauncher } from "./store/launcher";

const CONTACTS = [
  { name: "Maya", hue: 330, msg: { id: "Udah otw belum? Aku di kafe depan ya ☕", en: "Are you on the way? I'm at the cafe ☕" } },
  { name: "Budi", hue: 210, msg: { id: "Kerjanya mantap banget, lanjut besok ya!", en: "Great work, let's continue tomorrow!" } },
  { name: "Rina", hue: 150, msg: { id: "Fotonya bagus-bagus! Kirim yang lain dong", en: "The photos are great! Send the rest please" } },
  { name: "Dimas", hue: 30, msg: { id: "Nanti malam jadi main futsal?", en: "Still on for futsal tonight?" } },
];

export default function App() {
  const booted = useSystem((s) => s.booted);
  const locked = useSystem((s) => s.locked);
  const currentApp = useSystem((s) => s.currentApp);
  const dark = useDark();

  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => useSystem.setState({ booted: true }), useSettings.getState().bootAnimation ? 2600 : 150);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!isLauncher) return;
    useLauncher.getState().init().then(() => {
      const s = useLauncher.getState().status;
      if (s) applyNativeStatus(s);
    });
    useSystem.setState({ locked: false });
    window.__nativeStatus = (json) => {
      const s = parseStatus(json);
      if (s) {
        useLauncher.getState().setStatus(s);
        applyNativeStatus(s);
      }
    };
    const unsub = useLauncher.subscribe((s, prev) => {
      if (s.status && s.status !== prev.status) applyNativeStatus(s.status);
    });
    const poll = window.setInterval(() => {
      useLauncher.getState().refreshStatus();
    }, 30000);
    return () => {
      window.clearInterval(poll);
      unsub();
      delete window.__nativeStatus;
    };
  }, []);

  useEffect(() => {
    if (isLauncher) return;
    const drain = window.setInterval(() => {
      const st = useSystem.getState();
      const set = useSettings.getState();
      if (st.charging) {
        if (st.batteryLevel < 100) useSystem.setState({ batteryLevel: Math.min(100, st.batteryLevel + 2) });
      } else if (st.batteryLevel > 5 && !set.lowPower) {
        useSystem.setState({ batteryLevel: st.batteryLevel - 1 });
      }
    }, 45000);
    return () => window.clearInterval(drain);
  }, []);

  useEffect(() => {
    if (isLauncher) return;
    if (!useSettings.getState().demoNotifications) return;
    const first = window.setTimeout(() => {
      const c = CONTACTS[0];
      useNotifications.getState().push({
        app: "messages",
        title: `${c.name}`,
        body: useSettings.getState().lang === "id" ? c.msg.id : c.msg.en,
      });
      Sfx.receive();
      const id = useIsland.getState().add({ kind: "message", contact: { id: "c0", name: c.name, hue: c.hue, phone: "" }, body: useSettings.getState().lang === "id" ? c.msg.id : c.msg.en });
      window.setTimeout(() => useIsland.getState().remove(id), 7000);
    }, 7500);

    const interval = window.setInterval(() => {
      if (useSettings.getState().lang === "id") {
        const roll = Math.random();
        if (roll < 0.45) {
          const c = CONTACTS[Math.floor(Math.random() * CONTACTS.length)];
          useNotifications.getState().push({ app: "messages", title: c.name, body: c.msg.id });
          Sfx.receive();
          const id = useIsland.getState().add({ kind: "message", contact: { id: "c", name: c.name, hue: c.hue, phone: "" }, body: c.msg.id });
          window.setTimeout(() => useIsland.getState().remove(id), 7000);
        } else if (roll < 0.7) {
          startDeliveryDemo();
        } else if (roll < 0.85) {
          useNotifications.getState().push({ app: "appstore", title: "App Store", body: "3 pembaruan aplikasi tersedia" });
          Sfx.ding();
        } else {
          useNotifications.getState().push({ app: "mail", title: "Mail", body: "Tagihan e-statement kartu kreditmu sudah terbit" });
          Sfx.ding();
        }
      } else {
        const c = CONTACTS[Math.floor(Math.random() * CONTACTS.length)];
        useNotifications.getState().push({ app: "messages", title: c.name, body: c.msg.en });
        Sfx.receive();
        const id = useIsland.getState().add({ kind: "message", contact: { id: "c", name: c.name, hue: c.hue, phone: "" }, body: c.msg.en });
        window.setTimeout(() => useIsland.getState().remove(id), 7000);
      }
    }, 52000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        useSystem.setState({ controlCenter: false, notificationCenter: false, spotlight: false, appSwitcher: false, jiggle: false });
        useIsland.getState().expand(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const unsub = useSystem.subscribe((s, prev) => {
      if (s.charging !== prev.charging) {
        if (s.charging) {
          const id = useIsland.getState().add({ kind: "charging" });
          window.setTimeout(() => useIsland.getState().remove(id), 4000);
        } else {
          useIsland.getState().removeByKind("charging");
        }
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    const fired = new Set<string>();
    const tick = window.setInterval(() => {
      const island = useIsland.getState();
      const lang = useSettings.getState().lang;
      for (const a of island.activities) {
        if (a.kind === "timer" && a.pausedRemaining === undefined && a.endsAt && a.endsAt <= Date.now()) {
          island.remove(a.id);
          Sfx.timerDone();
          useNotifications.getState().push({
            app: "clock",
            title: lang === "id" ? "Timer Selesai" : "Timer Done",
            body: lang === "id" ? "Waktunya! ⏰" : "Time is up! ⏰",
          });
        }
        if (a.kind === "alarm" && a.pausedRemaining === undefined && a.endsAt && a.endsAt <= Date.now()) {
          island.remove(a.id);
        }
      }
      try {
        const alarms = JSON.parse(localStorage.getItem("ip17-alarms") ?? "[]") as { id: string; h: number; m: number; label: string; enabled: boolean }[];
        const now = new Date();
        for (const al of alarms) {
          if (!al.enabled) continue;
          if (al.h === now.getHours() && al.m === now.getMinutes()) {
            const key = `${al.id}-${now.getHours()}-${now.getMinutes()}`;
            if (fired.has(key)) continue;
            fired.add(key);
            useIsland.getState().add({ kind: "alarm", title: al.label, endsAt: Date.now() + 60_000, total: 60 });
            Sfx.alarm();
            useNotifications.getState().push({
              app: "clock",
              title: al.label,
              body: lang === "id" ? `Alarm ${String(al.h).padStart(2, "0")}:${String(al.m).padStart(2, "0")}` : `Alarm ${String(al.h).padStart(2, "0")}:${String(al.m).padStart(2, "0")}`,
            });
          }
        }
      } catch {
        void 0;
      }
    }, 1000);
    return () => window.clearInterval(tick);
  }, []);

  const AppComponent = currentApp ? APPS[currentApp]?.component : null;

  return (
    <DeviceStage>
      <div
        className={dark ? "theme-dark" : "theme-light"}
        style={
          {
            position: "absolute",
            inset: 0,
            color: dark ? "#fff" : "#000",
            ["--app-bg" as string]: dark ? "#000" : "#f2f2f7",
            ["--card" as string]: dark ? "#1c1c1e" : "#fff",
            ["--nav-blur" as string]: dark ? "rgba(18,18,22,0.72)" : "rgba(245,245,247,0.75)",
            ["--seg-thumb" as string]: dark ? "rgba(120,120,128,0.42)" : "rgba(255,255,255,0.9)",
          }
        }
      >
        {!booted && <BootScreen />}

        {booted && <HomeScreen />}
        {booted && <LockScreen />}

        <motion.div
          className="app-window"
          style={{ pointerEvents: currentApp ? "auto" : "none" }}
        >
          <AnimatePresence>
            {currentApp && (
              <motion.div
                key={currentApp}
                layoutId={`app-${currentApp}`}
                initial={{ opacity: 0.4 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30, opacity: { duration: 0.2 } }}
                style={{ position: "absolute", inset: 0, background: "var(--app-bg)", overflow: "hidden" }}
              >
                {AppComponent && <AppComponent />}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {booted && <StatusBar hideLeft={locked} />}
        <Gestures />
        {booted && <DynamicIsland />}
        {booted && <ControlCenter />}
        {booted && <NotificationCenter />}
        {booted && <Spotlight />}
        {booted && <AppSwitcher />}
        {booted && <HomeIndicator />}
        <AlertHost />
      </div>
    </DeviceStage>
  );
}

function applyNativeStatus(s: NativeStatus) {
  useSystem.setState({
    batteryLevel: s.battery,
    charging: s.charging,
    wifi: s.wifi,
    cellular: s.cellular,
    airplane: s.airplane,
  });
}

function startDeliveryDemo() {
  const island = useIsland.getState();
  const id = island.add({
    kind: "delivery",
    title: "Jajan Express",
    body: "Kurir sedang menuju lokasimu",
    status: 0,
    progress: 18,
  });
  useNotifications.getState().push({
    app: "maps",
    title: useSettings.getState().lang === "id" ? "Pesanan dalam perjalanan" : "Order on the way",
    body: useSettings.getState().lang === "id" ? "Jajan Express · estimasi 18 menit" : "Jajan Express · ETA 18 min",
  });
  Sfx.ding();
  window.setTimeout(() => island.update(id, { status: 1, body: "Kurir sedang mengambil pesananmu", progress: 9 }), 15000);
  window.setTimeout(() => island.update(id, { status: 2, body: "Kurir sudah di depan rumah!", progress: 2 }), 32000);
  window.setTimeout(() => {
    island.remove(id);
    useNotifications.getState().push({
      app: "maps",
      title: useSettings.getState().lang === "id" ? "Pesanan tiba" : "Order delivered",
      body: useSettings.getState().lang === "id" ? "Selamat menikmati! 🎉" : "Enjoy your meal! 🎉",
    });
    Sfx.timerDone();
  }, 45000);
}
