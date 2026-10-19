import { useEffect, useRef, useState } from "react";
import { useT } from "../i18n";
import { useSettings } from "../store/settings";
import { useIsland } from "../store/island";
import { useLocalState } from "../lib/useLocalState";
import { Sfx } from "../lib/sfx";
import { Haptics } from "../lib/haptics";
import { fmtDurationLong, pad2 } from "../lib/util";
import { TabBar, NavBar, Sheet } from "../components/ui/surfaces";
import { Switch, WheelPicker } from "../components/ui/controls";
import { BellIco, Play, Pause, Stop, WorldIco, TimerIco } from "../icons/Sys";

interface Alarm {
  id: string;
  h: number;
  m: number;
  label: string;
  enabled: boolean;
}

const DEFAULT_ALARMS: Alarm[] = [
  { id: "a1", h: 6, m: 30, label: "Bangun pagi", enabled: true },
  { id: "a2", h: 13, m: 0, label: "Istirahat siang", enabled: false },
  { id: "a3", h: 22, m: 15, label: "Waktunya tidur", enabled: true },
];

const CITIES = [
  { tz: "Asia/Jakarta", name: "Jakarta" },
  { tz: "Asia/Singapore", name: "Singapura" },
  { tz: "Asia/Tokyo", name: "Tokyo" },
  { tz: "Asia/Dubai", name: "Dubai" },
  { tz: "Europe/London", name: "London" },
  { tz: "America/New_York", name: "New York" },
  { tz: "Australia/Sydney", name: "Sydney" },
];

function cityNow(tz: string, now: Date) {
  const s = now.toLocaleString("en-US", { timeZone: tz, hour12: false });
  return new Date(s);
}

function WorldClockTab() {
  const t = useT();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const local = cityNow(Intl.DateTimeFormat().resolvedOptions().timeZone, now);
  return (
    <div className="scroll-y" id="app-scroll" style={{ position: "absolute", inset: 0, paddingTop: 158, paddingBottom: 110 }}>
      <div style={{ padding: "0 32px 10px", fontSize: 15, opacity: 0.55 }}>{t("clock.world")}</div>
      {CITIES.map((c) => {
        const d = cityNow(c.tz, now);
        const diff = Math.round((d.getTime() - local.getTime()) / 3600_000);
        const diffLabel = diff === 0 ? (useSettings.getState().lang === "id" ? "Waktu Anda" : "Your time") : `${diff > 0 ? "+" : ""}${diff}${useSettings.getState().lang === "id" ? "J" : "h"}`;
        const dayDiff = new Date(d).getDate() - new Date(local).getDate();
        return (
          <div key={c.tz} style={{ display: "flex", alignItems: "center", padding: "12px 32px", borderBottom: "0.5px solid rgba(120,120,128,0.2)" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, opacity: 0.5 }}>{diffLabel}</div>
              <div style={{ fontSize: 21, fontWeight: 600, marginTop: 2 }}>{c.name}</div>
            </div>
            <div style={{ fontSize: 42, fontWeight: 300, fontVariantNumeric: "tabular-nums", letterSpacing: 0.5 }}>
              {pad2(d.getHours())}:{pad2(d.getMinutes())}
              {dayDiff !== 0 && (
                <span style={{ fontSize: 12, opacity: 0.5, marginLeft: 6, fontWeight: 500 }}>
                  {dayDiff > 0 ? "+1" : "-1"}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AlarmTab() {
  const t = useT();
  const lang = useSettings((s) => s.lang);
  const [alarms, setAlarms] = useLocalState<Alarm[]>("alarms", DEFAULT_ALARMS);
  const [editing, setEditing] = useState<Alarm | null>(null);
  const [h, setH] = useState(7);
  const [m, setM] = useState(0);
  const [label, setLabel] = useState("");

  const openEdit = (a: Alarm | null) => {
    setEditing(a ?? { id: `a${Date.now()}`, h: 7, m: 0, label: "", enabled: true });
    setH(a?.h ?? 7);
    setM(a?.m ?? 0);
    setLabel(a?.label ?? "");
  };

  const save = () => {
    const item = { ...(editing as Alarm), h, m, label: label.trim() || (lang === "id" ? "Alarm" : "Alarm") };
    setAlarms((prev) => {
      const exists = prev.some((x) => x.id === item.id);
      return exists ? prev.map((x) => (x.id === item.id ? item : x)) : [...prev, item].sort((a, b) => a.h * 60 + a.m - (b.h * 60 + b.m));
    });
    setEditing(null);
  };

  return (
    <div className="scroll-y" id="app-scroll" style={{ position: "absolute", inset: 0, paddingTop: 158, paddingBottom: 110 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 32px 14px" }}>
        <span style={{ fontSize: 15, opacity: 0.55 }}>{t("clock.alarms")}</span>
        <button
          onClick={() => openEdit(null)}
          style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(120,120,128,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 400 }}
        >
          +
        </button>
      </div>
      <div style={{ margin: "0 20px", borderRadius: 14, background: "var(--card)", overflow: "hidden" }}>
        {alarms.length === 0 && <div style={{ padding: 24, textAlign: "center", opacity: 0.5, fontSize: 15 }}>{lang === "id" ? "Tidak ada alarm" : "No alarms"}</div>}
        {alarms.map((a, i) => (
          <div key={a.id} style={{ borderTop: i > 0 ? "0.5px solid rgba(120,120,128,0.25)" : undefined }}>
            <div style={{ display: "flex", alignItems: "center", padding: "12px 18px", gap: 10 }}>
              <div style={{ flex: 1, opacity: a.enabled ? 1 : 0.45 }} onClick={() => openEdit(a)}>
                <div style={{ fontSize: 44, fontWeight: 300, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
                  {pad2(a.h)}:{pad2(a.m)}
                </div>
                <div style={{ fontSize: 14, opacity: 0.6, marginTop: 4 }}>{a.label}</div>
              </div>
              <div style={{ opacity: a.enabled ? 1 : 0.45 }}>
                <Switch
                  checked={a.enabled}
                  onChange={(v) => setAlarms((prev) => prev.map((x) => (x.id === a.id ? { ...x, enabled: v } : x)))}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <Sheet open={!!editing} onClose={() => setEditing(null)}>
        <div style={{ padding: "0 16px 50px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <button onClick={() => setEditing(null)} style={{ color: "var(--blue)", fontSize: 17 }}>{t("common.cancel")}</button>
            <span style={{ fontSize: 17, fontWeight: 700 }}>{editing && alarms.some((x) => x.id === editing.id) ? (lang === "id" ? "Ubah Alarm" : "Edit Alarm") : (lang === "id" ? "Tambah Alarm" : "Add Alarm")}</span>
            <button onClick={save} style={{ color: "var(--blue)", fontSize: 17, fontWeight: 600 }}>{t("common.done")}</button>
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 4 }}>
            <WheelPicker values={Array.from({ length: 24 }, (_, i) => i)} value={h} onChange={setH} />
            <WheelPicker values={Array.from({ length: 60 }, (_, i) => i)} value={m} onChange={setM} />
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 18, overflowX: "auto" }}>
            {["Bangun pagi", "Olahraga", "Kerja", "Istirahat"].map((p) => (
              <button
                key={p}
                onClick={() => setLabel(p)}
                style={{ padding: "7px 14px", borderRadius: 999, background: label === p ? "var(--blue)" : "rgba(120,120,128,0.18)", color: label === p ? "#fff" : "inherit", fontSize: 14, whiteSpace: "nowrap" }}
              >
                {p}
              </button>
            ))}
          </div>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={lang === "id" ? "Label alarm" : "Alarm label"}
            style={{ width: "100%", marginTop: 14, padding: "11px 14px", borderRadius: 10, background: "rgba(120,120,128,0.16)", fontSize: 16 }}
          />
          {editing && alarms.some((x) => x.id === editing.id) && (
            <button
              onClick={() => {
                setAlarms((prev) => prev.filter((x) => x.id !== editing.id));
                setEditing(null);
              }}
              style={{ width: "100%", marginTop: 12, padding: "11px 0", borderRadius: 10, background: "rgba(255,69,58,0.15)", color: "#ff453a", fontSize: 16, fontWeight: 600 }}
            >
              {lang === "id" ? "Hapus Alarm" : "Delete Alarm"}
            </button>
          )}
        </div>
      </Sheet>
    </div>
  );
}

function StopwatchTab() {
  const t = useT();
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [laps, setLaps] = useState<number[]>([]);
  const base = useRef(0);
  const activityId = useRef<string | null>(null);

  useEffect(() => {
    if (!running) return;
    const startedAt = Date.now() - base.current * 1000;
    const id = window.setInterval(() => setElapsed((Date.now() - startedAt) / 1000), 47);
    return () => window.clearInterval(id);
  }, [running]);

  const start = () => {
    Haptics.medium();
    Sfx.tick();
    setRunning(true);
    activityId.current = useIsland.getState().add({ kind: "stopwatch", startedAt: Date.now() - base.current * 1000, title: "Stopwatch" });
  };

  const stop = () => {
    Haptics.heavy();
    setRunning(false);
    base.current = elapsed;
    if (activityId.current) useIsland.getState().remove(activityId.current);
    activityId.current = null;
  };

  const reset = () => {
    Haptics.light();
    setRunning(false);
    setElapsed(0);
    base.current = 0;
    setLaps([]);
    if (activityId.current) useIsland.getState().remove(activityId.current);
    activityId.current = null;
  };

  const cs = Math.floor((elapsed % 1) * 100);
  const secs = Math.floor(elapsed) % 60;
  const mins = Math.floor(elapsed / 60);

  return (
    <div style={{ position: "absolute", inset: 0, paddingTop: 150, paddingBottom: 120, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ fontSize: 92, fontWeight: 200, fontVariantNumeric: "tabular-nums", letterSpacing: -2 }}>
        {pad2(mins)}:{pad2(secs)}.{pad2(cs)}
      </div>
      <div style={{ display: "flex", gap: 44, marginTop: 46 }}>
        <button
          onClick={() => {
            Haptics.light();
            setLaps((l) => [elapsed, ...l]);
          }}
          disabled={!running}
          style={{ width: 84, height: 84, borderRadius: "50%", background: "rgba(120,120,128,0.22)", fontSize: 17, opacity: running ? 1 : 0.4 }}
        >
          {t("clock.lap")}
        </button>
        <button
          onClick={running ? stop : start}
          style={{ width: 84, height: 84, borderRadius: "50%", background: running ? "rgba(255,69,58,0.18)" : "rgba(48,209,88,0.2)", fontSize: 17, fontWeight: 600, color: running ? "#ff453a" : "#30d158", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          {running ? <Pause size={30} /> : <Play size={30} />}
        </button>
        <button
          onClick={reset}
          disabled={running || elapsed === 0}
          style={{ width: 84, height: 84, borderRadius: "50%", background: "rgba(120,120,128,0.22)", opacity: running || elapsed === 0 ? 0.4 : 1, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <Stop size={26} />
        </button>
      </div>
      <div className="scroll-y" style={{ width: "100%", marginTop: 30, padding: "0 30px" }}>
        {laps.map((l, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "9px 4px", borderBottom: "0.5px solid rgba(120,120,128,0.22)", fontSize: 16, fontVariantNumeric: "tabular-nums" }}>
            <span style={{ opacity: 0.6 }}>{t("clock.lap")} {laps.length - i}</span>
            <span>{pad2(Math.floor(l / 60))}:{pad2(Math.floor(l % 60))}.{pad2(Math.floor((l % 1) * 100))}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TimerTab() {
  const t = useT();
  const lang = useSettings((s) => s.lang);
  const [h, setH] = useState(0);
  const [m, setM] = useState(5);
  const [s, setS] = useState(0);
  const timer = useIsland((st) => st.activities.find((a) => a.kind === "timer"));
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);

  const total = h * 3600 + m * 60 + s;

  const start = () => {
    if (total <= 0) return;
    Haptics.heavy();
    Sfx.tick();
    useIsland.getState().add({
      kind: "timer",
      endsAt: Date.now() + total * 1000,
      total,
      title: lang === "id" ? "Timer" : "Timer",
    });
  };

  if (timer) {
    const rem = timer.pausedRemaining ?? Math.max(0, Math.ceil(((timer.endsAt ?? 0) - now) / 1000));
    const frac = timer.total ? rem / timer.total : 0;
    const r = 130;
    const circ = 2 * Math.PI * r;
    return (
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 150 }}>
        <div style={{ position: "relative", width: 300, height: 300 }}>
          <svg viewBox="0 0 300 300" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
            <circle cx="150" cy="150" r={r} fill="none" stroke="rgba(120,120,128,0.2)" strokeWidth="8" />
            <circle cx="150" cy="150" r={r} fill="none" stroke="#ff9f0a" strokeWidth="8" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - frac)} style={{ transition: "stroke-dashoffset 0.3s linear" }} />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64, fontWeight: 200, fontVariantNumeric: "tabular-nums" }}>
            {fmtDurationLong(rem)}
          </div>
        </div>
        <div style={{ display: "flex", gap: 44, marginTop: 50 }}>
          <button
            onClick={() => {
              Haptics.medium();
              const st = useIsland.getState();
              if (timer.pausedRemaining !== undefined) {
                st.update(timer.id, { endsAt: Date.now() + timer.pausedRemaining * 1000, pausedRemaining: undefined });
              } else {
                const rem2 = Math.max(0, Math.ceil(((timer.endsAt ?? 0) - Date.now()) / 1000));
                st.update(timer.id, { pausedRemaining: rem2 });
              }
            }}
            style={{ width: 84, height: 84, borderRadius: "50%", background: "rgba(120,120,128,0.22)", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            {timer.pausedRemaining !== undefined ? <Play size={30} /> : <Pause size={30} />}
          </button>
          <button
            onClick={() => {
              Haptics.heavy();
              useIsland.getState().remove(timer.id);
            }}
            style={{ width: 84, height: 84, borderRadius: "50%", background: "rgba(255,69,58,0.18)", color: "#ff453a", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <Stop size={26} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 130 }}>
      <div style={{ display: "flex", gap: 2 }}>
        <WheelPicker values={Array.from({ length: 24 }, (_, i) => i)} value={h} onChange={setH} width={80} textSize={30} />
        <WheelPicker values={Array.from({ length: 60 }, (_, i) => i)} value={m} onChange={setM} width={80} textSize={30} />
        <WheelPicker values={Array.from({ length: 60 }, (_, i) => i)} value={s} onChange={setS} width={80} textSize={30} />
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap", justifyContent: "center", padding: "0 30px" }}>
        {[1, 5, 10, 15, 30, 60].map((mm) => (
          <button
            key={mm}
            onClick={() => {
              Haptics.selection();
              setH(0);
              setM(mm);
              setS(0);
            }}
            style={{ padding: "7px 14px", borderRadius: 999, background: "rgba(120,120,128,0.18)", fontSize: 13.5 }}
          >
            {mm >= 60 ? `${mm / 60} ${lang === "id" ? "jam" : "hr"}` : `${mm} min`}
          </button>
        ))}
      </div>
      <button
        onClick={start}
        disabled={total <= 0}
        style={{
          marginTop: 34,
          width: 84,
          height: 84,
          borderRadius: "50%",
          background: total > 0 ? "rgba(255,159,10,0.22)" : "rgba(120,120,128,0.16)",
          color: total > 0 ? "#ff9f0a" : "rgba(150,150,160,1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <TimerIco size={34} />
      </button>
      <div style={{ marginTop: 12, fontSize: 13.5, opacity: 0.5 }}>{t("clock.whenTimerEnds")}</div>
    </div>
  );
}

export default function ClockApp() {
  const t = useT();
  const [tab, setTab] = useState(0);
  return (
    <div style={{ position: "absolute", inset: 0, background: "var(--app-bg)" }}>
      <NavBar
        title={tab === 0 ? t("clock.world") : tab === 1 ? t("clock.alarms") : tab === 2 ? t("clock.stopwatch") : t("clock.timers")}
      />
      {tab === 0 && <WorldClockTab />}
      {tab === 1 && <AlarmTab />}
      {tab === 2 && <StopwatchTab />}
      {tab === 3 && <TimerTab />}
      <TabBar
        tabs={[
          { icon: <WorldIco size={22} />, label: t("clock.world") },
          { icon: <BellIco size={22} />, label: t("clock.alarms") },
          { icon: <Stop size={20} />, label: t("clock.stopwatch") },
          { icon: <TimerIco size={22} />, label: t("clock.timers") },
        ]}
        active={tab}
        onChange={setTab}
        tint="#ff9f0a"
      />
    </div>
  );
}
