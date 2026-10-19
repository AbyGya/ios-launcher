import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useT } from "../i18n";
import { useSettings } from "../store/settings";
import { Sfx } from "../lib/sfx";
import { hashCode, seededRandom } from "../lib/util";
import { NavBar, PushView } from "../components/ui/surfaces";
import { ChevronRight, HeartIco, Moon, TimerIco, ListIco, Person } from "../icons/Sys";

const MOVE = { value: 420, goal: 600, unit: "kkal" };
const EXERCISE = { value: 38, goal: 30, unit: "mnt" };
const STAND = { value: 9, goal: 12, unit: "jam" };

function Ring({ r, width, frac, hue }: { r: number; width: number; frac: number; hue: string }) {
  const c = 2 * Math.PI * r;
  const done = Math.min(1, frac);
  return (
    <>
      <circle cx="90" cy="90" r={r} fill="none" stroke={hue} strokeOpacity={0.22} strokeWidth={width} />
      <motion.circle
        cx="90"
        cy="90"
        r={r}
        fill="none"
        stroke={hue}
        strokeWidth={width}
        strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: c * (1 - done) }}
        transition={{ duration: 1.1, ease: "easeOut", delay: 0.15 }}
        transform="rotate(-90 90 90)"
      />
    </>
  );
}

function ActivityRings() {
  const t = useT();
  return (
    <div style={{ margin: "4px 16px 0", borderRadius: 16, background: "var(--card)", padding: "18px 20px", display: "flex", alignItems: "center", gap: 22 }}>
      <svg width="150" height="150" viewBox="0 0 180 180" style={{ flexShrink: 0 }}>
        <Ring r={76} width={13} frac={MOVE.value / MOVE.goal} hue="#ff2d55" />
        <Ring r={59} width={13} frac={EXERCISE.value / EXERCISE.goal} hue="#a6ff00" />
        <Ring r={42} width={13} frac={STAND.value / STAND.goal} hue="#2ee6e6" />
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
        {[
          { label: t("health.move"), v: MOVE, hue: "#ff2d55" },
          { label: t("health.exercise"), v: EXERCISE, hue: "#a6ff00" },
          { label: t("health.stand"), v: STAND, hue: "#2ee6e6" },
        ].map((row) => (
          <div key={row.label}>
            <div style={{ fontSize: 12, color: row.hue, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4 }}>{row.label}</div>
            <div style={{ fontSize: 19, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
              {row.v.value}
              <span style={{ fontSize: 13, fontWeight: 500, opacity: 0.45 }}> / {row.v.goal} {row.v.unit}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function useHealthData() {
  return useMemo(() => {
    const rnd = seededRandom(hashCode("health-17"));
    const steps = Array.from({ length: 7 }, (_, i) => Math.round(5200 + rnd() * 6400 + (i === 6 ? 1200 : 0)));
    const heart = Array.from({ length: 26 }, () => Math.round(64 + rnd() * 26));
    heart[heart.length - 1] = 72;
    const sleep = Array.from({ length: 5 }, () => ({
      deep: 1.1 + rnd() * 0.6,
      light: 3.4 + rnd() * 1.3,
      rem: 1.2 + rnd() * 0.8,
    }));
    return { steps, heart, sleep };
  }, []);
}

function BarChart({ data, tint, days, height = 120 }: { data: number[]; tint: string; days: string[]; height?: number }) {
  const max = Math.max(...data);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: height + 22 }}>
      {data.map((v, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <div style={{ fontSize: 10, opacity: 0.45, fontVariantNumeric: "tabular-nums" }}>{i === data.length - 1 ? v.toLocaleString("id-ID") : ""}</div>
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: Math.round((v / max) * height) }}
            transition={{ duration: 0.7, delay: i * 0.05, ease: "easeOut" }}
            style={{ width: "100%", borderRadius: 6, background: i === data.length - 1 ? tint : "rgba(120,120,128,0.25)" }}
          />
          <div style={{ fontSize: 10.5, opacity: 0.5 }}>{days[i]}</div>
        </div>
      ))}
    </div>
  );
}

function HeartChart({ data, width = 340, height = 90 }: { data: number[]; width?: number; height?: number }) {
  const min = Math.min(...data) - 4;
  const max = Math.max(...data) + 4;
  const pts = data.map((v, i) => [(i / (data.length - 1)) * width, height - ((v - min) / (max - min)) * height]);
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${path} L${width},${height} L0,${height} Z`;
  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ display: "block" }}>
      <defs>
        <linearGradient id="hrgrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff375f" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#ff375f" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#hrgrad)" />
      <path d={path} fill="none" stroke="#ff375f" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function HealthApp() {
  const t = useT();
  const lang = useSettings((s) => s.lang);
  const { steps, heart, sleep } = useHealthData();
  const [push, setPush] = useState(false);

  const hrMin = Math.min(...heart);
  const hrMax = Math.max(...heart);
  const hrAvg = Math.round(heart.reduce((a, b) => a + b, 0) / heart.length);

  const metrics = [
    { key: "steps", label: t("health.steps"), value: steps[6].toLocaleString(lang === "id" ? "id-ID" : "en-US"), icon: <ListIco size={16} strokeWidth={2} color="#ff9f0a" />, tint: "#ff9f0a" },
    { key: "heart", label: t("health.heart"), value: `${heart[heart.length - 1]} bpm`, icon: <HeartIco size={16} strokeWidth={2} color="#ff375f" />, tint: "#ff375f" },
    { key: "sleep", label: t("health.sleep"), value: `${Math.floor(sleep[4].deep + sleep[4].light + sleep[4].rem)}j ${Math.round(((sleep[4].deep + sleep[4].light + sleep[4].rem) % 1) * 60)}m`, icon: <Moon size={16} strokeWidth={2} color="#5e5ce6" />, tint: "#5e5ce6" },
    { key: "stand", label: t("health.standHours"), value: String(STAND.value), icon: <TimerIco size={16} strokeWidth={2} color="#2ee6e6" />, tint: "#2ee6e6" },
    { key: "exercise", label: t("health.exercise"), value: String(EXERCISE.value), icon: <Person size={16} strokeWidth={2} color="#a6ff00" />, tint: "#a6ff00" },
  ];

  return (
    <div style={{ position: "absolute", inset: 0, background: "var(--app-bg)" }}>
      <div className="scroll-y" id="app-scroll" style={{ position: "absolute", inset: 0, paddingTop: 0, paddingBottom: 110 }}>
        <NavBar
          title={t("health.title")}
          right={
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(120,120,128,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>
              A
            </div>
          }
        />
        <div style={{ padding: "0 16px 4px", fontSize: 13, fontWeight: 600, opacity: 0.55, textTransform: "uppercase", letterSpacing: 0.5 }}>
          {t("health.activity")} · {t("common.today")}
        </div>
        <ActivityRings />

        <div style={{ margin: "16px 16px 0", borderRadius: 16, background: "var(--card)", padding: "16px 18px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 15.5, fontWeight: 700 }}>{t("health.steps")}</span>
            <span style={{ fontSize: 13, opacity: 0.5 }}>
              {t("health.avg")} {new Intl.NumberFormat(lang === "id" ? "id-ID" : "en-US", { notation: "compact", maximumFractionDigits: 1 }).format(Math.round(steps.reduce((a, b) => a + b, 0) / steps.length))}
            </span>
          </div>
          <BarChart data={steps} tint="#ff9f0a" days={lang === "id" ? ["S", "S", "R", "K", "J", "S", "M"] : ["M", "T", "W", "T", "F", "S", "S"]} />
        </div>

        <button
          onClick={() => {
            setPush(true);
            Sfx.tick();
          }}
          style={{ display: "block", width: "calc(100% - 32px)", margin: "16px 16px 0", borderRadius: 16, background: "var(--card)", padding: "16px 18px", textAlign: "left" }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10 }}>
            <HeartIco size={15} strokeWidth={2.2} color="#ff375f" />
            <span style={{ fontSize: 15.5, fontWeight: 700 }}>{t("health.heart")}</span>
            <span style={{ fontSize: 13, opacity: 0.5 }}>{hrAvg} bpm · {t("health.avg")}</span>
            <ChevronRight size={14} strokeWidth={2.4} style={{ marginLeft: "auto", opacity: 0.35 }} />
          </div>
          <HeartChart data={heart} height={70} />
        </button>

        <div style={{ margin: "16px 16px 0", borderRadius: 16, background: "var(--card)", padding: "16px 18px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 15.5, fontWeight: 700 }}>{t("health.sleep")}</span>
            <span style={{ fontSize: 13, opacity: 0.5 }}>5 {t("health.lastNights")}</span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 14, height: 110 }}>
            {sleep.map((s, i) => {
              const total = s.deep + s.light + s.rem;
              return (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 2, height: "100%" }}>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(s.rem / 8) * 100}%` }}
                    transition={{ duration: 0.6, delay: i * 0.06 }}
                    style={{ borderRadius: "6px 6px 0 0", background: "#7d7aff" }}
                  />
                  <motion.div initial={{ height: 0 }} animate={{ height: `${(s.light / 8) * 100}%` }} transition={{ duration: 0.6, delay: i * 0.06 }} style={{ background: "#5e5ce6" }} />
                  <motion.div initial={{ height: 0 }} animate={{ height: `${(s.deep / 8) * 100}%` }} transition={{ duration: 0.6, delay: i * 0.06 }} style={{ borderRadius: "0 0 6px 6px", background: "#3634a3" }} />
                  <div style={{ fontSize: 10, opacity: 0.45, textAlign: "center", marginTop: 4 }}>{Math.floor(total)}j</div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ padding: "20px 26px 7px", fontSize: 13, fontWeight: 600, opacity: 0.55, textTransform: "uppercase", letterSpacing: 0.5 }}>
          {t("health.activity")}
        </div>
        <div style={{ margin: "0 16px 20px", borderRadius: 12, background: "var(--card)", overflow: "hidden" }}>
          {metrics.map((m, i) => (
            <button
              key={m.key}
              onClick={() => {
                if (m.key === "heart") {
                  setPush(true);
                  Sfx.tick();
                }
              }}
              className={i > 0 ? "list-sep" : undefined}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", textAlign: "left" }}
            >
              <div style={{ width: 30, height: 30, borderRadius: 9, background: `${m.tint}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {m.icon}
              </div>
              <span style={{ flex: 1, fontSize: 15.5, fontWeight: 500 }}>{m.label}</span>
              <span style={{ fontSize: 15, opacity: 0.55, fontVariantNumeric: "tabular-nums" }}>{m.value}</span>
              <ChevronRight size={14} strokeWidth={2.4} style={{ opacity: 0.3 }} />
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {push && (
          <PushView onClose={() => setPush(false)}>
            <NavBar title={t("health.heart")} large={false} onBack={() => setPush(false)} />
            <div className="scroll-y" style={{ position: "absolute", inset: 0, paddingTop: 116, paddingBottom: 60 }}>
              <div style={{ textAlign: "center", marginTop: 6 }}>
                <HeartIco size={26} strokeWidth={2} color="#ff375f" />
                <div style={{ fontSize: 44, fontWeight: 700, marginTop: 4, fontVariantNumeric: "tabular-nums" }}>
                  {heart[heart.length - 1]}
                  <span style={{ fontSize: 16, fontWeight: 500, opacity: 0.45 }}> bpm</span>
                </div>
                <div style={{ fontSize: 13.5, opacity: 0.5 }}>{t("common.today")}, 08:41</div>
              </div>
              <div style={{ margin: "22px 16px 0", borderRadius: 16, background: "var(--card)", padding: "16px 10px 10px" }}>
                <HeartChart data={heart} height={110} />
              </div>
              <div style={{ display: "flex", gap: 12, margin: "16px 16px 0" }}>
                {[
                  { label: t("health.min"), v: hrMin },
                  { label: t("health.avg"), v: hrAvg },
                  { label: t("health.max"), v: hrMax },
                ].map((s) => (
                  <div key={s.label} style={{ flex: 1, borderRadius: 14, background: "var(--card)", padding: "12px 14px" }}>
                    <div style={{ fontSize: 12, opacity: 0.5, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>{s.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, marginTop: 2, fontVariantNumeric: "tabular-nums" }}>{s.v}</div>
                  </div>
                ))}
              </div>
            </div>
          </PushView>
        )}
      </AnimatePresence>
    </div>
  );
}
