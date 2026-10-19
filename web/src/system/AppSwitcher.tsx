import { motion } from "framer-motion";
import { useSystem } from "../store/system";
import { APPS } from "../apps/registry";
import { AppIconArt } from "../icons/AppIcons";
import { translate, useT } from "../i18n";
import { useSettings } from "../store/settings";
import { Sfx } from "../lib/sfx";
import { Haptics } from "../lib/haptics";
import { generateWallpaper } from "../lib/wallpaper";

export function AppSwitcher() {
  const t = useT();
  const lang = useSettings((s) => s.lang);
  const open = useSystem((s) => s.appSwitcher);
  const recents = useSystem((s) => s.recents);
  const wallpaper = useSettings((s) => s.wallpaper);
  const customWallpaper = useSettings((s) => s.customWallpaper);
  const bg = customWallpaper ?? generateWallpaper(wallpaper === "custom" ? "cosmic" : wallpaper);

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: "absolute", inset: 0, zIndex: 158 }}
    >
      <div className="wallpaper" style={{ backgroundImage: `url(${bg})`, filter: "blur(46px) brightness(0.42)", transform: "scale(1.2)" }} />

      <div
        onClick={() => useSystem.setState({ appSwitcher: false })}
        style={{ position: "absolute", inset: 0 }}
      />

      <div
        className="scroll-x"
        onClick={(e) => e.stopPropagation()}
        style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0, display: "flex", alignItems: "center", gap: 22, padding: "0 40px" }}
      >
        {recents.length === 0 && (
          <div style={{ margin: "0 auto", color: "rgba(255,255,255,0.6)", fontSize: 15 }}>{t("switcher.noApps")}</div>
        )}
        {recents.map((id) => {
          const app = APPS[id];
          if (!app) return null;
          return (
            <motion.div
              key={id}
              layout
              drag="y"
              dragConstraints={{ top: -700, bottom: 0 }}
              dragElastic={0.5}
              onDragEnd={(_, info) => {
                if (info.offset.y < -180) {
                  Haptics.warning();
                  Sfx.whoosh(false);
                  useSystem.setState({ recents: useSystem.getState().recents.filter((r) => r !== id) });
                }
              }}
              onClick={() => {
                Haptics.medium();
                Sfx.click();
                useSystem.getState().launchApp(id);
              }}
              whileTap={{ scale: 1.04 }}
              style={{
                width: 310,
                height: 660,
                borderRadius: 44,
                background: "rgba(24,24,30,0.72)",
                backdropFilter: "blur(24px)",
                boxShadow: "0 30px 80px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(255,255,255,0.1)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 18,
                flexShrink: 0,
                cursor: "pointer",
                overflow: "hidden",
                position: "relative",
              }}
            >
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 54, background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.65)" }}>
                {translate(lang, `app.${id}`)}
              </div>
              <AppIconArt id={id} size={92} />
              <div style={{ fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>{translate(lang, `app.${id}`)}</div>
            </motion.div>
          );
        })}
      </div>

      <div style={{ position: "absolute", bottom: 24, left: 0, right: 0, textAlign: "center", fontSize: 12.5, color: "rgba(255,255,255,0.55)" }}>
        {t("lock.swipeUp")}
      </div>
    </motion.div>
  );
}
