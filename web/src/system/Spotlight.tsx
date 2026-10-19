import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useSystem } from "../store/system";
import { useSettings } from "../store/settings";
import { generateWallpaper } from "../lib/wallpaper";
import { APPS } from "../apps/registry";
import { AppIconArt } from "../icons/AppIcons";
import { Magnifier } from "../icons/Sys";
import { translate } from "../i18n";
import { Sfx } from "../lib/sfx";
import { Haptics } from "../lib/haptics";
import type { AppId } from "../types";
import { isLauncher } from "../native/bridge";
import { useLauncher } from "../store/launcher";
import { NativeIcon } from "../components/NativeIcon";

export function Spotlight() {
  const open = useSystem((s) => s.spotlight);
  const lang = useSettings((s) => s.lang);
  const wallpaper = useSettings((s) => s.wallpaper);
  const customWallpaper = useSettings((s) => s.customWallpaper);
  const allApps = useMemo(() => Object.keys(APPS) as AppId[], []);
  const nativeApps = useLauncher((s) => s.apps);
  const nativeHidden = useLauncher((s) => s.hidden);
  const [query, setQuery] = useState("");
  const bg = customWallpaper ?? generateWallpaper(wallpaper === "custom" ? "cosmic" : wallpaper);
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allApps;
    return allApps.filter((id) => {
      const name = translate(lang, `app.${id}`).toLowerCase();
      const en = translate("en", `app.${id}`).toLowerCase();
      return name.includes(q) || en.includes(q);
    });
  }, [allApps, query, lang]);
  const nativeResults = useMemo(() => {
    if (!isLauncher) return [];
    const q = query.trim().toLowerCase();
    return nativeApps
      .filter((a) => !nativeHidden.includes(a.pkg))
      .filter((a) => !q || a.label.toLowerCase().includes(q))
      .slice(0, 20);
  }, [nativeApps, nativeHidden, query]);

  if (!open) return null;

  const launch = (id: AppId) => {
    Haptics.medium();
    Sfx.click();
    setQuery("");
    useSystem.getState().launchApp(id);
  };

  const launchNative = (pkg: string) => {
    Haptics.medium();
    Sfx.click();
    setQuery("");
    void useLauncher.getState().launch(pkg);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      onClick={() => {
        setQuery("");
        useSystem.setState({ spotlight: false });
      }}
      style={{ position: "absolute", inset: 0, zIndex: 165 }}
    >
      <div className="wallpaper" style={{ backgroundImage: `url(${bg})`, filter: "blur(52px) brightness(0.5)", transform: "scale(1.2)" }} />
      <div style={{ position: "absolute", inset: 0, background: "rgba(8,8,10,0.3)" }} />

      <motion.div
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 380, damping: 32, delay: 0.03 }}
        onClick={(e) => e.stopPropagation()}
        style={{ position: "absolute", top: 80, left: 20, right: 20 }}
      >
        <div className="glass glass-strong" style={{ height: 46, borderRadius: 14, display: "flex", alignItems: "center", gap: 8, padding: "0 13px" }}>
          <Magnifier size={19} color="rgba(160,160,170,1)" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={translate(lang, "spotlight.noResult").split(" ")[0] + " " + translate(lang, "common.search").toLowerCase()}
            style={{ flex: 1, fontSize: 18, color: "#fff" }}
          />
        </div>

        <div className="scroll-y" style={{ marginTop: 16, maxHeight: 720 }}>
          {!query && (
            <div style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.85)", marginBottom: 12 }}>
              {translate(lang, "spotlight.suggestions")}
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18 }}>
            {nativeResults.map((app) => (
              <div key={app.pkg} onClick={() => launchNative(app.pkg)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer" }}>
                <NativeIcon pkg={app.pkg} label={app.label} size={62} />
                <span style={{ fontSize: 11.5, color: "#fff", fontWeight: 500, textShadow: "0 1px 6px rgba(0,0,0,0.5)", maxWidth: 76, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {app.label}
                </span>
              </div>
            ))}
            {results.slice(0, Math.max(0, 20 - nativeResults.length)).map((id) => (
              <div key={id} onClick={() => launch(id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer" }}>
                <AppIconArt id={id} size={62} />
                <span style={{ fontSize: 11.5, color: "#fff", fontWeight: 500, textShadow: "0 1px 6px rgba(0,0,0,0.5)" }}>
                  {translate(lang, `app.${id}`)}
                </span>
              </div>
            ))}
          </div>
          {results.length + nativeResults.length === 0 && (
            <div style={{ textAlign: "center", marginTop: 60, color: "rgba(255,255,255,0.6)", fontSize: 15 }}>
              {translate(lang, "spotlight.noResult")}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
