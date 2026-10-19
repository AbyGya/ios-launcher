import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useIsland } from "../store/island";
import { useSystem } from "../store/system";
import { useMedia } from "../store/media";
import { useSettings } from "../store/settings";
import { engine } from "../lib/music";
import { TRACKS } from "../lib/tracks";
import { Sfx } from "../lib/sfx";
import { Haptics } from "../lib/haptics";
import { fmtDurationLong, initials, avatarGradient } from "../lib/util";
import {
  FaceIDIco,
  LockIco,
  Mic,
  NextIco,
  Pause,
  PhoneDown,
  Play,
  PrevIco,
  Stop,
  TimerIco,
  BellIco,
  Airplay,
  MessageIco,
} from "../icons/Sys";
import type { Activity } from "../types";

function Bolt({ size = 16, color = "#30d158" }: { size?: number; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill={color}>
      <path d="M13.5 2 5 13.2h5.2L9.4 22 19 10.4h-5.5z" />
    </svg>
  );
}

function AirdropIco({ size = 18, color = "#0a84ff" }: { size?: number; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="9" r="2.4" fill={color} stroke="none" />
      <path d="M6.3 17.2a8 8 0 0 1 0-9.4M17.7 7.8a8 8 0 0 1 0 9.4" />
      <path d="M8.6 15.6a5 5 0 0 1 0-6.2M15.4 9.4a5 5 0 0 1 0 6.2" />
      <path d="M10.2 14.2a2.6 2.6 0 0 1 0-2.4" />
    </svg>
  );
}

function BagIco({ size = 20, color = "#ff9f0a" }: { size?: number; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round">
      <path d="M5 8.5h14l-1 11.2c-.1 1-.9 1.8-2 1.8H8c-1.1 0-1.9-.8-2-1.8z" />
      <path d="M8.6 8.5V7a3.4 3.4 0 0 1 6.8 0v1.5" />
    </svg>
  );
}

export function Waveform({ bars = 9, level = 7, height = 22, color = "#fff" }: { bars?: number; level?: number; height?: number; color?: string }) {
  const [levels, setLevels] = useState<number[]>(() => new Array(bars).fill(0.3));
  const raf = useRef(0);
  useEffect(() => {
    const tick = () => {
      setLevels(engine.levels());
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, []);
  const active = useMedia((s) => s.playing);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2.4, height }}>
      {Array.from({ length: bars }).map((_, i) => {
        const lv = active ? levels[i % levels.length] ?? 0.2 : 0.12;
        return (
          <div
            key={i}
            style={{
              width: 2.6,
              height: Math.max(3, lv * height),
              borderRadius: 2,
              background: color,
              opacity: 0.95,
              transition: "height 0.09s linear",
            }}
          />
        );
      })}
    </div>
  );
}

function useInterval(cb: () => void, ms: number, active = true) {
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(cb, ms);
    return () => window.clearInterval(id);
  }, [cb, ms, active]);
}

function useLongPress(onLong: () => void, onClick: () => void, ms = 380) {
  const timer = useRef<number | null>(null);
  const fired = useRef(false);
  const start = () => {
    fired.current = false;
    timer.current = window.setTimeout(() => {
      fired.current = true;
      Haptics.medium();
      onLong();
    }, ms);
  };
  const cancel = () => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
  };
  const click = () => {
    if (!fired.current) onClick();
  };
  return {
    onPointerDown: start,
    onPointerUp: () => {
      cancel();
      click();
    },
    onPointerLeave: cancel,
  };
}

function ProgressBar({ value, height = 5, onSeek }: { value: number; height?: number; onSeek?: (v: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const seekTo = (clientX: number) => {
    const el = ref.current;
    if (!el || !onSeek) return;
    const r = el.getBoundingClientRect();
    onSeek(Math.min(1, Math.max(0, (clientX - r.left) / r.width)));
  };
  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (dragging.current) seekTo(e.clientX);
    };
    const up = () => (dragging.current = false);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  });
  return (
    <div
      ref={ref}
      onPointerDown={(e) => {
        dragging.current = true;
        seekTo(e.clientX);
      }}
      style={{ height, borderRadius: 99, background: "rgba(255,255,255,0.22)", position: "relative", touchAction: "none" }}
    >
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${value * 100}%`, borderRadius: 99, background: "#fff" }} />
    </div>
  );
}

function Ring({ value, size = 64, thickness = 5 }: { value: number; size?: number; thickness?: number }) {
  const r = (size - thickness) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={thickness} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#ff9f0a"
        strokeWidth={thickness}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - value)}
        style={{ transition: "stroke-dashoffset 0.4s linear" }}
      />
    </svg>
  );
}

export function DynamicIsland() {
  const activities = useIsland((s) => s.activities);
  const expandedId = useIsland((s) => s.expanded);
  const active = useIsland((s) => s.active());
  const expand = useIsland((s) => s.expand);
  const mediaPlaying = useMedia((s) => s.playing);
  const mediaCurrentId = useMedia((s) => s.currentId);
  const mediaTrack = TRACKS.find((t) => t.id === mediaCurrentId);
  const lang = useSettings((s) => s.lang);
  const batteryLevel = useSystem((s) => s.batteryLevel);
  const [now, setNow] = useState(Date.now());
  useInterval(() => setNow(Date.now()), 250, !!active);

  const secondary = activities.find((a) => a.kind !== active?.kind && (a.kind === "timer" || a.kind === "music"));

  const isExpanded = !!active && expandedId === active.id && active.kind !== "faceid";

  let w = 126;
  let h = 37;
  let r = 20;
  if (active && !isExpanded) {
    const base = {
      music: secondary ? 224 : 190,
      call: 190,
      facetime: 190,
      timer: 150,
      alarm: 150,
      recording: 178,
      charging: 150,
      airdrop: 178,
      delivery: 190,
      message: 196,
      stopwatch: 160,
      faceid: 126,
    }[active.kind];
    w = base;
    h = 37;
  }
  if (active && isExpanded) {
    const size = {
      music: [370, 184],
      call: [370, 214],
      facetime: [370, 214],
      timer: [370, 168],
      alarm: [370, 168],
      recording: [340, 132],
      charging: [300, 120],
      airdrop: [330, 128],
      delivery: [370, 158],
      message: [370, 136],
      stopwatch: [330, 150],
      faceid: [240, 150],
    }[active.kind];
    w = size[0];
    h = size[1];
    r = 38;
  }

  const timerRemaining = (a: Activity) =>
    a.kind === "timer" || a.kind === "alarm"
      ? a.pausedRemaining !== undefined
        ? a.pausedRemaining
        : Math.max(0, Math.ceil(((a.endsAt ?? 0) - now) / 1000))
      : 0;
  const elapsedSince = (a: Activity) => Math.floor((now - (a.startedAt ?? a.createdAt ?? now)) / 1000);

  const openAppFor = () => {
    const sys = useSystem.getState();
    const kind = active?.kind;
    if (kind === "music") sys.launchApp("music");
    else if (kind === "call" || kind === "message") sys.launchApp(kind === "call" ? "phone" : "messages");
    else if (kind === "facetime") sys.launchApp("facetime");
    else if (kind === "timer" || kind === "alarm" || kind === "stopwatch") sys.launchApp("clock");
    else if (kind === "charging") sys.launchApp("settings");
  };

  const press = useLongPress(
    () => active && expand(active.id),
    () => {
      if (!active) return;
      if (isExpanded) expand(null);
      else expand(active.id);
    },
  );

  const mediaProgress = mediaTrack
    ? (useMedia.getState().position % mediaTrack.duration) / mediaTrack.duration
    : 0;

  const content = () => {
    if (!active) return null;
    if (active.kind === "faceid") {
      return (
        <div key="faceid" style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <FaceIDIco size={20} />
          {active.state === "scanning" && (
            <div style={{ display: "flex", gap: 4 }}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{ width: 4, height: 4, borderRadius: 4, background: "#fff", animation: `pulse-dot 0.9s ${i * 0.18}s infinite` }}
                />
              ))}
            </div>
          )}
          {active.state === "success" && (
            <motion.div initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ color: "#30d158" }}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#30d158" strokeWidth="2.6" strokeLinecap="round">
                <path d="M4.5 12.5 9.5 17.5 19.5 6.5" />
              </svg>
            </motion.div>
          )}
        </div>
      );
    }

    if (!isExpanded) {
      return (
        <motion.div
          key={`compact-${active.kind}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 14px" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {active.kind === "music" && (
              <>
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 7,
                    background: mediaTrack
                      ? `linear-gradient(145deg, hsl(${mediaTrack.hue},80%,58%), hsl(${mediaTrack.hue2},75%,40%))`
                      : "#333",
                  }}
                />
                <Waveform bars={7} height={18} />
              </>
            )}
            {active.kind === "call" && (
              <>
                <div style={{ width: 8, height: 8, borderRadius: 8, background: "#30d158", animation: "pulse-dot 1s infinite" }} />
                <span style={{ fontSize: 14, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                  {active.state === "ringing" ? (lang === "id" ? "Panggilan..." : "Calling...") : fmtDurationLong(elapsedSince(active))}
                </span>
              </>
            )}
            {active.kind === "facetime" && (
              <>
                <div style={{ width: 8, height: 8, borderRadius: 8, background: "#30d158", animation: "pulse-dot 1s infinite" }} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>FaceTime · {fmtDurationLong(elapsedSince(active))}</span>
              </>
            )}
            {(active.kind === "timer" || active.kind === "alarm") && (
              <>
                <TimerIco size={17} color={active.kind === "alarm" ? "#ff9f0a" : "#fff"} strokeWidth={2.2} />
                <span style={{ fontSize: 14.5, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                  {fmtDurationLong(timerRemaining(active))}
                </span>
              </>
            )}
            {active.kind === "recording" && (
              <>
                <div style={{ width: 8, height: 8, borderRadius: 8, background: "#ff453a", animation: "pulse-dot 1.2s infinite" }} />
                <span style={{ fontSize: 13.5, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{fmtDurationLong(elapsedSince(active))}</span>
              </>
            )}
            {active.kind === "charging" && (
              <>
                <Bolt size={17} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>{batteryLevel}%</span>
              </>
            )}
            {active.kind === "airdrop" && (
              <>
                <AirdropIco size={17} />
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>AirDrop</span>
              </>
            )}
            {active.kind === "delivery" && (
              <>
                <BagIco size={17} />
                <span style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 200 }}>
                  {active.title}
                </span>
              </>
            )}
            {active.kind === "message" && (
              <>
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: avatarGradient(active.contact?.hue ?? 200), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700 }}>
                  {initials(active.contact?.name ?? "A")}
                </div>
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>{active.contact?.name}</span>
              </>
            )}
            {active.kind === "stopwatch" && (
              <>
                <TimerIco size={17} strokeWidth={2.2} />
                <span style={{ fontSize: 14, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{fmtDurationLong(elapsedSince(active))}</span>
              </>
            )}
          </div>
          {secondary && secondary.kind === "timer" && active.kind !== "timer" && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <TimerIco size={15} strokeWidth={2.2} color="#ff9f0a" />
              <span style={{ fontSize: 13.5, fontWeight: 600, fontVariantNumeric: "tabular-nums", color: "#ff9f0a" }}>
                {fmtDurationLong(timerRemaining(secondary))}
              </span>
            </div>
          )}
          {secondary && secondary.kind === "music" && active.kind !== "music" && (
            <Waveform bars={6} height={16} />
          )}
        </motion.div>
      );
    }

    return (
      <motion.div
        key={`expanded-${active.kind}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18, delay: 0.06 }}
        style={{ position: "absolute", inset: 0, padding: "16px 20px", display: "flex", flexDirection: "column", justifyContent: "center" }}
      >
        {active.kind === "music" && mediaTrack && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{ width: 52, height: 52, borderRadius: 12, background: `linear-gradient(145deg, hsl(${mediaTrack.hue},80%,58%), hsl(${mediaTrack.hue2},75%,40%))`, flexShrink: 0 }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{mediaTrack.title}</div>
                <div style={{ fontSize: 13, opacity: 0.6 }}>{mediaTrack.artist}</div>
              </div>
              <Airplay size={20} color="rgba(255,255,255,0.7)" />
              <Waveform bars={8} height={22} />
            </div>
            <ProgressBar
              value={mediaProgress}
              onSeek={(v) => engine.seek(v * mediaTrack.duration)}
            />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 34, marginTop: 2 }}>
              <button onClick={() => { Haptics.light(); Sfx.tick(); engine.prev(); }}>
                <PrevIco size={26} />
              </button>
              <button
                onClick={() => {
                  Haptics.medium();
                  Sfx.click();
                  engine.toggle();
                }}
              >
                {mediaPlaying ? <Pause size={30} /> : <Play size={30} />}
              </button>
              <button onClick={() => { Haptics.light(); Sfx.tick(); engine.next(); }}>
                <NextIco size={26} />
              </button>
            </div>
          </div>
        )}

        {(active.kind === "call" || active.kind === "facetime") && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 58,
                height: 58,
                borderRadius: "50%",
                background: avatarGradient(active.contact?.hue ?? 210),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                fontWeight: 700,
              }}
            >
              {initials(active.contact?.name ?? "A")}
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 19, fontWeight: 700 }}>{active.contact?.name}</div>
              <div style={{ fontSize: 13, opacity: 0.6, fontVariantNumeric: "tabular-nums" }}>
                {active.state === "ringing"
                  ? lang === "id"
                    ? "Panggilan masuk"
                    : "Incoming call"
                  : `${active.kind === "facetime" ? "FaceTime" : "iPhone"} · ${fmtDurationLong(elapsedSince(active))}`}
              </div>
            </div>
            {active.state === "ringing" ? (
              <div style={{ display: "flex", gap: 80, marginTop: 4 }}>
                <button
                  onClick={() => {
                    Haptics.heavy();
                    Sfx.error();
                    useIsland.getState().removeByKind(active.kind);
                  }}
                  style={{ width: 56, height: 56, borderRadius: "50%", background: "#ff453a", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <PhoneDown size={26} color="#fff" />
                </button>
                <button
                  onClick={() => {
                    Haptics.success();
                    Sfx.click();
                    useIsland.getState().update(active.id, { state: "active", startedAt: Date.now() });
                  }}
                  style={{ width: 56, height: 56, borderRadius: "50%", background: "#30d158", display: "flex", alignItems: "center", justifyContent: "center", animation: "breathe 1.4s infinite" }}
                >
                  <PhoneDown size={26} color="#fff" style={{ transform: "rotate(135deg)" }} />
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 22, marginTop: 6 }}>
                {[
                  { on: active.muted, label: <Mic size={20} color="#fff" />, toggle: true },
                  { on: true, label: <span style={{ fontSize: 12, color: "#fff" }}>🔊</span>, toggle: false },
                  { on: false, label: <span style={{ width: 26, height: 26, borderRadius: 8, border: "1.6px solid #fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff" }}>1</span>, toggle: false },
                ].map((b, i) => (
                  <button
                    key={i}
                    onClick={() => b.toggle && useIsland.getState().update(active.id, { muted: !active.muted })}
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: "50%",
                      background: b.on && b.toggle ? "#fff" : i === 0 && active.muted ? "#ff453a" : "rgba(255,255,255,0.16)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {b.label}
                  </button>
                ))}
                <button
                  onClick={() => {
                    Haptics.heavy();
                    Sfx.error();
                    useIsland.getState().removeByKind(active.kind);
                  }}
                  style={{ width: 46, height: 46, borderRadius: "50%", background: "#ff453a", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <PhoneDown size={22} color="#fff" />
                </button>
              </div>
            )}
          </div>
        )}

        {(active.kind === "timer" || active.kind === "alarm") && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: 40, fontWeight: 700, fontVariantNumeric: "tabular-nums", letterSpacing: -1 }}>
              {fmtDurationLong(timerRemaining(active))}
            </div>
            <div style={{ width: "80%" }}>
              <ProgressBar value={active.total ? 1 - timerRemaining(active) / active.total : 0} />
            </div>
            <div style={{ fontSize: 12.5, opacity: 0.55 }}>{active.label}</div>
            <div style={{ display: "flex", gap: 86, marginTop: 2 }}>
              <button
                onClick={() => {
                  Haptics.light();
                  Sfx.tick();
                  const st = useIsland.getState();
                  if (active.pausedRemaining !== undefined) {
                    st.update(active.id, { endsAt: Date.now() + active.pausedRemaining * 1000, pausedRemaining: undefined });
                  } else {
                    const rem = Math.max(0, ((active.endsAt ?? 0) - Date.now()) / 1000);
                    st.update(active.id, { pausedRemaining: rem });
                  }
                }}
                style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,0.16)", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                {active.pausedRemaining !== undefined ? <Play size={22} /> : <Pause size={22} />}
              </button>
              <button
                onClick={() => {
                  Haptics.medium();
                  Sfx.error();
                  useIsland.getState().removeByKind(active.kind);
                }}
                style={{ width: 48, height: 48, borderRadius: "50%", background: "#ff453a", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <Stop size={20} color="#fff" />
              </button>
            </div>
          </div>
        )}

        {active.kind === "recording" && (
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 10, height: 10, borderRadius: 10, background: "#ff453a", animation: "pulse-dot 1.1s infinite" }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15.5, fontWeight: 700 }}>
                {active.title ?? (lang === "id" ? "Merekam layar" : "Screen recording")}
              </div>
              <div style={{ fontSize: 12.5, opacity: 0.6, fontVariantNumeric: "tabular-nums" }}>{fmtDurationLong(elapsedSince(active))}</div>
            </div>
            <button
              onClick={() => {
                Haptics.medium();
                Sfx.click();
                if (useSystem.getState().screenRecord) useSystem.setState({ screenRecord: false });
                useIsland.getState().removeByKind("recording");
              }}
              style={{ padding: "9px 16px", borderRadius: 99, background: "#ff453a", fontSize: 14, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: 7 }}
            >
              <Stop size={14} color="#fff" />
              Stop
            </button>
          </div>
        )}

        {active.kind === "charging" && (
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Ring value={batteryLevel / 100} size={64} />
            <div>
              <div style={{ fontSize: 30, fontWeight: 700 }}>{batteryLevel}%</div>
              <div style={{ fontSize: 13, opacity: 0.6 }}>
                {lang === "id" ? "Mengisi daya" : "Charging"} <Bolt size={13} />
              </div>
            </div>
            <div style={{ marginLeft: "auto" }}>
              <Bolt size={30} />
            </div>
          </div>
        )}

        {active.kind === "airdrop" && (
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <AirdropIco size={30} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15.5, fontWeight: 700 }}>{active.title}</div>
              <div style={{ marginTop: 8 }}>
                <ProgressBar value={active.progress ?? 0} />
              </div>
            </div>
            <span style={{ fontSize: 13, opacity: 0.7, fontVariantNumeric: "tabular-nums" }}>{Math.round((active.progress ?? 0) * 100)}%</span>
          </div>
        )}

        {active.kind === "delivery" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,159,10,0.16)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <BagIco size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15.5, fontWeight: 700 }}>{active.title}</div>
                <div style={{ fontSize: 12.5, opacity: 0.6 }}>{active.body}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 17, fontWeight: 700 }}>{active.progress} mnt</div>
                <div style={{ fontSize: 11, opacity: 0.5 }}>ETA</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 0, padding: "0 8px" }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", flex: i < 2 ? 1 : 0 }}>
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 12,
                      background: (active.status ?? 0) >= i ? "#ff9f0a" : "rgba(255,255,255,0.2)",
                      transition: "background 0.4s ease",
                    }}
                  />
                  {i < 2 && (
                    <div style={{ flex: 1, height: 3, margin: "0 6px", borderRadius: 2, background: (active.status ?? 0) > i ? "#ff9f0a" : "rgba(255,255,255,0.2)", transition: "background 0.4s ease" }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {active.kind === "message" && (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: avatarGradient(active.contact?.hue ?? 200),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 15,
                fontWeight: 700,
              }}
            >
              {initials(active.contact?.name ?? "A")}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{active.contact?.name}</div>
              <div style={{ fontSize: 13, opacity: 0.65, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{active.body}</div>
            </div>
            <MessageIco size={24} color="#30d158" />
          </div>
        )}

        {active.kind === "stopwatch" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: 40, fontWeight: 700, fontVariantNumeric: "tabular-nums", letterSpacing: -1 }}>{fmtDurationLong(elapsedSince(active))}</div>
            <div style={{ fontSize: 12.5, opacity: 0.55 }}>
              {lang === "id" ? "Stopwatch" : "Stopwatch"}
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <>
      {isExpanded && (
        <div
          style={{ position: "absolute", inset: 0, zIndex: 85 }}
          onClick={(e) => {
            e.stopPropagation();
            expand(null);
          }}
        />
      )}
      <div className="island-layer" style={{ top: 12 }}>
        <motion.div
          className={isExpanded ? "island island-expanded" : "island"}
          animate={{ width: w, height: h, borderRadius: isExpanded ? r : h / 2 }}
          initial={false}
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
          {...(!isExpanded && active ? press : {})}
          onClick={() => {
            if (!active) return;
            if (isExpanded) expand(null);
          }}
          style={{ position: "relative" }}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {content()}
          </AnimatePresence>
          {!active && (
            <div
              style={{
                position: "absolute",
                right: 13,
                top: "50%",
                transform: "translateY(-50%)",
                width: 11,
                height: 11,
                borderRadius: "50%",
                background: "radial-gradient(circle at 35% 30%, #2a2a3a, #05050a 70%)",
                boxShadow: "inset 0 0 2px rgba(90,120,255,0.5)",
              }}
            />
          )}
        </motion.div>
      </div>
    </>
  );
}
