import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSystem } from "../store/system";
import { useSettings } from "../store/settings";
import { useIsland } from "../store/island";
import { useNotifications } from "../store/notifications";
import { generateWallpaper } from "../lib/wallpaper";
import { Sfx } from "../lib/sfx";
import { Haptics } from "../lib/haptics";
import { Flashlight, FaceIDIco, Sun, CameraGlyph, GearIco } from "../icons/Sys";
import { AppIconArt } from "../icons/AppIcons";
import { useClock } from "../system/StatusBar";
import { useT } from "../i18n";

export function LockScreen() {
  const locked = useSystem((s) => s.locked);
  if (!locked) return null;
  return <LockScreenInner />;
}

function LockScreenInner() {
  const t = useT();
  const lang = useSettings((s) => s.lang);
  const wallpaper = useSettings((s) => s.wallpaper);
  const customWallpaper = useSettings((s) => s.customWallpaper);
  const clockGlass = useSettings((s) => s.clockGlass);
  const alwaysOn = useSystem((s) => s.alwaysOn);
  const batteryLevel = useSystem((s) => s.batteryLevel);
  const charging = useSystem((s) => s.charging);
  const flashlight = useSystem((s) => s.flashlight);
  const notifications = useNotifications((s) => s.items);
  const now = useClock(1000);
  const [unlocking, setUnlocking] = useState(false);
  const [faceState, setFaceState] = useState<"idle" | "scanning" | "success">("idle");
  const startY = useRef<number | null>(null);

  const bg = customWallpaper ?? generateWallpaper(wallpaper === "custom" ? "cosmic" : wallpaper);

  const triggerUnlock = () => {
    if (unlocking || faceState !== "idle") return;
    setUnlocking(true);
    setFaceState("scanning");
    useIsland.getState().add({ kind: "faceid", state: "scanning" });
    Haptics.medium();
    window.setTimeout(() => {
      setFaceState("success");
      useIsland.setState((s) => ({
        activities: s.activities.map((a) => (a.kind === "faceid" ? { ...a, state: "success" } : a)),
      }));
      Sfx.unlock();
      Haptics.success();
    }, 950);
    window.setTimeout(() => {
      useIsland.getState().removeByKind("faceid");
      useSystem.getState().unlockDevice();
      setUnlocking(false);
      setFaceState("idle");
    }, 1600);
  };

  const dateLabel = `${t(`time.days.${now.getDay()}`)}, ${now.getDate()} ${t(`time.months.${now.getMonth() + 1}`)}`;
  const timeLabel = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const onPointerDown = (e: React.PointerEvent) => {
    if (alwaysOn) {
      useSystem.setState({ alwaysOn: false });
      return;
    }
    startY.current = e.clientY;
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (startY.current === null) return;
    if (e.clientY - startY.current < -80 && !unlocking) {
      startY.current = null;
      triggerUnlock();
    }
  };
  const onPointerUp = () => {
    startY.current = null;
  };

  const dim = alwaysOn ? 0.26 : 1;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.06 }}
      animate={{ opacity: 1, scale: alwaysOn ? 1 : 1.015 }}
      exit={{ opacity: 0, scale: 1.08, transition: { duration: 0.35 } }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{ position: "absolute", inset: 0, zIndex: 110, overflow: "hidden" }}
    >
      <div
        className="wallpaper"
        style={{
          backgroundImage: `url(${bg})`,
          transform: alwaysOn ? "scale(1.02)" : "scale(1.06)",
          transition: "transform 1.4s cubic-bezier(0.22,1,0.36,1)",
        }}
      />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.34) 0%, rgba(0,0,0,0) 32%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.42) 100%)" }} />

      <div style={{ position: "absolute", inset: 0, opacity: dim, transition: "opacity 0.6s ease" }}>
        {!alwaysOn && (
          <div style={{ position: "absolute", top: 74, left: 0, right: 0, textAlign: "center" }}>
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{ fontSize: 21, fontWeight: 600, opacity: 0.92, textShadow: "0 1px 12px rgba(0,0,0,0.35)" }}
            >
              {dateLabel}
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 200, damping: 24 }}
              style={{
                fontSize: 92,
                lineHeight: 1.04,
                fontWeight: 700,
                letterSpacing: -2,
                fontVariantNumeric: "tabular-nums",
                background: clockGlass
                  ? "linear-gradient(180deg, rgba(255,255,255,0.99), rgba(255,255,255,0.7))"
                  : undefined,
                WebkitBackgroundClip: clockGlass ? "text" : undefined,
                backgroundClip: clockGlass ? "text" : undefined,
                WebkitTextFillColor: clockGlass ? "transparent" : undefined,
                textShadow: clockGlass ? "0 2px 26px rgba(0,0,0,0.18)" : "0 2px 18px rgba(0,0,0,0.4)",
              }}
            >
              {timeLabel}
            </motion.div>
          </div>
        )}

        <div
          style={{
            position: "absolute",
            top: alwaysOn ? 110 : 262,
            left: 18,
            right: 18,
            display: "flex",
            gap: 10,
            justifyContent: "center",
          }}
        >
          <div className="glass" style={{ flex: 1, maxWidth: 136, borderRadius: 18, padding: "9px 12px", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 22, height: 22, borderRadius: 7, background: "#ff453a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12 }}>
              {now.getDate()}
            </div>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 700 }}>{t(`time.daysShort.${now.getDay()}`)}</div>
              <div style={{ fontSize: 10.5, opacity: 0.65 }}>{t(`time.months.${now.getMonth() + 1}`)}</div>
            </div>
          </div>
          <div className="glass" style={{ flex: 1, maxWidth: 136, borderRadius: 18, padding: "9px 12px", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ color: "#ffd60a" }}>
              <Sun size={21} strokeWidth={2.1} />
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700 }}>31°</div>
              <div style={{ fontSize: 10.5, opacity: 0.65 }}>Jakarta</div>
            </div>
          </div>
          <div className="glass" style={{ flex: 1, maxWidth: 136, borderRadius: 18, padding: "9px 12px", display: "flex", alignItems: "center", gap: 8 }}>
            <GearIco size={20} strokeWidth={2} />
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700 }}>{batteryLevel}%</div>
              <div style={{ fontSize: 10.5, opacity: 0.65 }}>
                {charging ? (lang === "id" ? "Mengisi" : "Charging") : "Baterai"}
              </div>
            </div>
          </div>
        </div>

        {!alwaysOn && (
          <div style={{ position: "absolute", left: 14, right: 14, bottom: 128, display: "flex", flexDirection: "column", gap: 9 }}>
            <AnimatePresence>
              {notifications.slice(0, 3).map((n, i) => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 24, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96, x: -60 }}
                  transition={{ delay: i * 0.06, type: "spring", stiffness: 380, damping: 32 }}
                  className="glass"
                  onClick={() => {
                    useSystem.getState().unlockDevice();
                    useSystem.getState().launchApp(n.app);
                  }}
                  style={{ borderRadius: 22, padding: "11px 13px", display: "flex", gap: 10, alignItems: "center", cursor: "pointer" }}
                >
                  <div style={{ width: 38, height: 38, flexShrink: 0 }}>
                    <AppIconArt id={n.app} size={38} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 700 }}>{n.title}</span>
                      <span style={{ fontSize: 12, opacity: 0.6 }}>{t("notification.now")}</span>
                    </div>
                    <div style={{ fontSize: 13.5, opacity: 0.82, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {n.body}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {!alwaysOn && faceState === "idle" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            style={{ position: "absolute", bottom: 86, left: 0, right: 0, textAlign: "center", fontSize: 14, opacity: 0.72, fontWeight: 500, textShadow: "0 1px 8px rgba(0,0,0,0.4)" }}
          >
            {t("lock.swipeUp")}
          </motion.div>
        )}

        {!alwaysOn && faceState === "scanning" && (
          <div style={{ position: "absolute", bottom: 86, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
            <div style={{ width: 38, height: 38, animation: "breathe 1s infinite", background: "rgba(255,255,255,0.16)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FaceIDIco size={24} />
            </div>
          </div>
        )}

        <div style={{ position: "absolute", bottom: 42, left: 40, right: 40, display: "flex", justifyContent: "space-between" }}>
          <button
            className="glass"
            onClick={() => {
              Haptics.medium();
              Sfx.click();
              useSystem.setState({ flashlight: !useSystem.getState().flashlight });
            }}
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: flashlight ? "#fff" : undefined,
              color: flashlight ? "#111" : "#fff",
            }}
          >
            <Flashlight size={23} />
          </button>
          <button
            className="glass"
            onClick={() => {
              Haptics.medium();
              Sfx.click();
              useSystem.getState().unlockDevice();
              window.setTimeout(() => useSystem.getState().launchApp("camera"), 250);
            }}
            style={{ width: 52, height: 52, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}
          >
            <CameraGlyph size={23} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
