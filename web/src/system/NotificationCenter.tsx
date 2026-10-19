import { motion, AnimatePresence } from "framer-motion";
import { useSystem } from "../store/system";
import { useNotifications } from "../store/notifications";
import { useSettings } from "../store/settings";
import { generateWallpaper } from "../lib/wallpaper";
import { relTime } from "../lib/util";
import { Sfx } from "../lib/sfx";
import { Haptics } from "../lib/haptics";
import { AppIconArt } from "../icons/AppIcons";
import { Xmark } from "../icons/Sys";
import { useClock } from "./StatusBar";
import { useT } from "../i18n";

export function NotificationCenter() {
  const t = useT();
  const lang = useSettings((s) => s.lang);
  const open = useSystem((s) => s.notificationCenter);
  const locked = useSystem((s) => s.locked);
  const wallpaper = useSettings((s) => s.wallpaper);
  const customWallpaper = useSettings((s) => s.customWallpaper);
  const items = useNotifications((s) => s.items);
  const dismiss = useNotifications((s) => s.dismiss);
  const clear = useNotifications((s) => s.clear);
  const now = useClock(10000);
  const bg = customWallpaper ?? generateWallpaper(wallpaper === "custom" ? "cosmic" : wallpaper);

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      style={{ position: "absolute", inset: 0, zIndex: 155 }}
    >
      <div className="wallpaper" style={{ backgroundImage: `url(${bg})`, filter: "blur(40px) brightness(0.55)", transform: "scale(1.15)" }} />
      <div style={{ position: "absolute", inset: 0, background: "rgba(5,5,8,0.35)" }} />

      <div
        onClick={() => useSystem.setState({ notificationCenter: false })}
        style={{ position: "absolute", inset: 0 }}
      />

      <div style={{ position: "absolute", top: 30, left: 0, right: 0, textAlign: "center", pointerEvents: "none" }}>
        <div style={{ fontSize: 17, fontWeight: 600, opacity: 0.85 }}>
          {t(`time.days.${now.getDay()}`)}, {now.getDate()} {t(`time.months.${now.getMonth() + 1}`)}
        </div>
        <div style={{ fontSize: 76, fontWeight: 700, letterSpacing: -2, lineHeight: 1.1, fontVariantNumeric: "tabular-nums" }}>
          {String(now.getHours()).padStart(2, "0")}:{String(now.getMinutes()).padStart(2, "0")}
        </div>
      </div>

      {items.length > 0 && !locked && (
        <button
          onClick={() => {
            Haptics.medium();
            Sfx.tick();
            clear();
          }}
          className="glass"
          style={{ position: "absolute", top: 210, left: 20, borderRadius: 999, padding: "7px 14px", fontSize: 13.5, fontWeight: 600 }}
        >
          {t("notification.clearAll")}
        </button>
      )}

      <div
        className="scroll-y"
        style={{ position: "absolute", top: locked ? 150 : 254, left: 14, right: 14, bottom: 40, display: "flex", flexDirection: "column", gap: 10 }}
      >
        <AnimatePresence>
          {items.map((n) => (
            <motion.div
              key={n.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: -120, transition: { duration: 0.2 } }}
              drag="x"
              dragConstraints={{ left: -140, right: 0 }}
              dragElastic={0.3}
              onDragEnd={(_, info) => {
                if (info.offset.x < -90) {
                  Haptics.light();
                  Sfx.tick();
                  dismiss(n.id);
                }
              }}
              className="glass"
              onClick={() => {
                useSystem.getState().launchApp(n.app);
              }}
              style={{ borderRadius: 22, padding: "12px 14px", display: "flex", gap: 11, alignItems: "center", cursor: "pointer", touchAction: "pan-y" }}
            >
              <div style={{ width: 41, height: 41, flexShrink: 0 }}>
                <AppIconArt id={n.app} size={41} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ fontSize: 14.5, fontWeight: 700 }}>{n.title}</span>
                  <span style={{ fontSize: 12, opacity: 0.6, flexShrink: 0 }}>{relTime(n.time, lang)}</span>
                </div>
                <div style={{ fontSize: 14, opacity: 0.85, lineHeight: 1.35 }}>{n.body}</div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  Haptics.light();
                  dismiss(n.id);
                }}
                style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(120,120,128,0.35)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
              >
                <Xmark size={12} strokeWidth={2.6} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        {items.length === 0 && (
          <div style={{ textAlign: "center", marginTop: 80, opacity: 0.55, fontSize: 15, fontWeight: 500 }}>
            {t("lock.noNotifications")}
          </div>
        )}
      </div>
    </motion.div>
  );
}
