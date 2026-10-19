import { motion } from "framer-motion";
import { useSystem } from "../store/system";
import { useSettings } from "../store/settings";
import { useIsland } from "../store/island";
import { useMedia } from "../store/media";
import { engine } from "../lib/music";
import { TRACKS } from "../lib/tracks";
import { Sfx } from "../lib/sfx";
import { Haptics } from "../lib/haptics";
import { cn } from "../lib/util";
import { Slider } from "../components/ui/controls";
import {
  Airplane,
  Airplay,
  Bluetooth,
  CameraGlyph,
  Flashlight,
  Mic,
  Moon,
  NextIco,
  Pause,
  Play,
  PrevIco,
  Rotate,
  Sun,
  TimerIco,
  VolumeHigh,
  Wifi,
} from "../icons/Sys";
import { useT } from "../i18n";

function Toggle({
  on,
  onToggle,
  children,
  color = "#0a84ff",
  size = 54,
  iconColor,
}: {
  on: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  color?: string;
  size?: number;
  iconColor?: string;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={() => {
        Haptics.light();
        Sfx.tick();
        onToggle();
      }}
      className={cn(on ? undefined : "glass")}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: on ? color : "rgba(120,120,128,0.28)",
        color: on ? iconColor ?? "#fff" : "rgba(235,235,245,0.95)",
        transition: "background 0.25s ease",
        flexShrink: 0,
      }}
    >
      {children}
    </motion.button>
  );
}

function Module({
  children,
  style,
  onClick,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
}) {
  return (
    <div
      className="glass glass-strong"
      onClick={onClick}
      style={{ borderRadius: 26, padding: 12, position: "relative", ...style }}
    >
      {children}
    </div>
  );
}

export function ControlCenter() {
  const t = useT();
  const open = useSystem((s) => s.controlCenter);
  const sys = useSystem();
  const set = useSettings((s) => s.set);
  const brightness = useSettings((s) => s.brightness);
  const volume = useSettings((s) => s.volume);
  const dark = useSettings((s) => s.theme) === "dark";
  const currentId = useMedia((s) => s.currentId);
  const playing = useMedia((s) => s.playing);
  const track = TRACKS.find((x) => x.id === currentId);

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      onClick={() => useSystem.setState({ controlCenter: false })}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 160,
        background: "rgba(8,8,12,0.42)",
        backdropFilter: "blur(44px) saturate(160%)",
        WebkitBackdropFilter: "blur(44px) saturate(160%)",
        paddingTop: 66,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 14,
      }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", gap: 14 }}>
        <Module style={{ width: 170, height: 168, padding: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, placeItems: "center" }}>
            <Toggle
              on={sys.airplane}
              color="#ff9f0a"
              onToggle={() =>
                useSystem.setState({
                  airplane: !sys.airplane,
                  wifi: sys.airplane ? sys.wifi : false,
                  cellular: sys.airplane ? sys.cellular : false,
                })
              }
            >
              <Airplane size={24} />
            </Toggle>
            <Toggle
              on={sys.cellular && !sys.airplane}
              color="#30d158"
              onToggle={() => useSystem.setState({ cellular: !sys.cellular, airplane: false })}
            >
              <Mic size={24} style={{ transform: "rotate(90deg) scaleX(1.1)" }} />
            </Toggle>
            <Toggle
              on={sys.wifi && !sys.airplane}
              onToggle={() => useSystem.setState({ wifi: !sys.wifi, airplane: false })}
            >
              <Wifi size={24} />
            </Toggle>
            <Toggle on={sys.bluetooth} onToggle={() => useSystem.setState({ bluetooth: !sys.bluetooth })}>
              <Bluetooth size={24} />
            </Toggle>
          </div>
        </Module>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Module style={{ width: 170, height: 78, display: "flex", alignItems: "center", gap: 10, padding: "0 14px" }}>
            <button
              onClick={() => {
                Haptics.light();
                Sfx.tick();
                useSystem.setState({ focus: !sys.focus });
              }}
              style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, color: sys.focus ? "#fff" : "rgba(235,235,245,0.9)" }}
            >
              <Moon size={20} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>{t("cc.focus")}</span>
            </button>
            <div style={{ width: 1, height: 28, background: "rgba(255,255,255,0.18)" }} />
            <Toggle
              on={dark}
              size={40}
              color="#5e5ce6"
              onToggle={() => set({ theme: dark ? "light" : "dark" })}
            >
              {dark ? <Moon size={19} /> : <Sun size={19} />}
            </Toggle>
          </Module>
          <Module
            style={{ width: 170, height: 78, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px" }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(235,235,245,0.9)" }}>{t("cc.mirror")}</span>
            <Airplay size={20} />
          </Module>
        </div>
      </div>

      <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <Module style={{ width: 170, height: 96, display: "flex", alignItems: "center", gap: 10, padding: "0 12px" }}>
          {track ? (
            <>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: `linear-gradient(145deg, hsl(${track.hue},80%,58%), hsl(${track.hue2},75%,40%))`,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{track.title}</div>
                <div style={{ fontSize: 11, opacity: 0.6 }}>{track.artist}</div>
              </div>
              <button
                onClick={() => {
                  Haptics.medium();
                  Sfx.click();
                  engine.toggle();
                }}
                style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                {playing ? <Pause size={17} /> : <Play size={17} />}
              </button>
            </>
          ) : (
            <div
              onClick={() => useSystem.getState().launchApp("music")}
              style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", cursor: "pointer" }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(145deg,#fb5c74,#f5234e)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Play size={18} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{t("cc.music")}</span>
            </div>
          )}
        </Module>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { on: sys.flashlight, icon: <Flashlight size={21} />, toggle: () => useSystem.setState({ flashlight: !sys.flashlight }), label: t("cc.flashlight") },
            { on: sys.rotationLock, icon: <Rotate size={21} />, toggle: () => useSystem.setState({ rotationLock: !sys.rotationLock }), label: t("cc.rotateLock") },
            { on: false, icon: <TimerIco size={21} />, toggle: () => useSystem.getState().launchApp("clock"), label: t("cc.timer") },
            { on: false, icon: <CameraGlyph size={21} />, toggle: () => useSystem.getState().launchApp("camera"), label: t("cc.camera") },
          ].map((x, i) => (
            <Toggle key={i} on={x.on} size={52} onToggle={x.toggle}>
              {x.icon}
            </Toggle>
          ))}
        </div>
      </div>

      <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", gap: 14, marginTop: 4 }}>
        <Module style={{ width: 170, height: 216, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <Slider
            vertical
            length={186}
            thickness={62}
            value={brightness}
            onChange={(v) => set({ brightness: v })}
            icon={<Sun size={24} color="#fff" strokeWidth={2} />}
          />
        </Module>
        <Module style={{ width: 170, height: 216, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <Slider
            vertical
            length={186}
            thickness={62}
            value={volume}
            onChange={(v) => set({ volume: v })}
            icon={<VolumeHigh size={24} color="#fff" strokeWidth={2} />}
          />
        </Module>
      </div>

      <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 2 }}>
        <Toggle
          on={useSettings.getState().lowPower}
          color="#ffd60a"
          iconColor="#111"
          onToggle={() => set({ lowPower: !useSettings.getState().lowPower })}
        >
          <span style={{ fontSize: 20 }}>🔋</span>
        </Toggle>
        <Toggle
          on={sys.screenRecord}
          color="#ff453a"
          onToggle={() => {
            if (sys.screenRecord) {
              useSystem.setState({ screenRecord: false });
              useIsland.getState().removeByKind("recording");
            } else {
              useSystem.setState({ screenRecord: true });
              useIsland.getState().add({ kind: "recording", startedAt: Date.now() });
            }
          }}
        >
          <div style={{ width: 16, height: 16, borderRadius: 16, border: "3px solid #fff" }} />
        </Toggle>
        <Module style={{ height: 54, borderRadius: 27, display: "flex", alignItems: "center", gap: 10, padding: "0 18px" }}>
          <button
            onClick={() => {
              if (sys.rotationLock) return;
              Haptics.medium();
              Sfx.whoosh();
              useSystem.setState({ orientation: sys.orientation === "portrait" ? "landscape" : "portrait" });
            }}
            style={{ display: "flex", alignItems: "center", gap: 8, opacity: sys.rotationLock ? 0.45 : 1 }}
          >
            <Rotate size={19} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>{t("cc.rotate")}</span>
          </button>
        </Module>
        {/* prev/next compact for music */}
        {track && (
          <div className="glass glass-strong" style={{ height: 54, borderRadius: 27, display: "flex", alignItems: "center", gap: 4, padding: "0 10px" }}>
            <button onClick={() => engine.prev()} style={{ padding: 6 }}>
              <PrevIco size={20} />
            </button>
            <button onClick={() => engine.next()} style={{ padding: 6 }}>
              <NextIco size={20} />
            </button>
          </div>
        )}
      </div>

      <div style={{ position: "absolute", bottom: 26, left: 0, right: 0, textAlign: "center", fontSize: 12, opacity: 0.4 }}>
        {t("cc.title")}
      </div>
    </motion.div>
  );
}
