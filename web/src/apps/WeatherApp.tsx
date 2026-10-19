import { useMemo, useState } from "react";
import { useT, translate } from "../i18n";
import { useSettings } from "../store/settings";
import { WEATHER_CITIES } from "../lib/data";
import { hashCode, seededRandom, clamp } from "../lib/util";
import { useLocalState } from "../lib/useLocalState";
import { Sfx } from "../lib/sfx";
import { Haptics } from "../lib/haptics";
import { Sheet } from "../components/ui/surfaces";
import { Ellipsis, LocationPin, Moon, Sun } from "../icons/Sys";

function SunIco({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#ffd60a" strokeWidth={2} strokeLinecap="round">
      <circle cx="12" cy="12" r="4.2" fill="#ffd60a" stroke="none" />
      <path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5.2 5.2l1.7 1.7M17.1 17.1l1.7 1.7M18.8 5.2l-1.7 1.7M6.9 17.1l-1.7 1.7" />
    </svg>
  );
}

function CloudIco({ size = 24, color = "#e8e8ec" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.5 18.5a4 4 0 0 1-.4-8A5.4 5.4 0 0 1 16.6 9a3.8 3.8 0 0 1 .9 7.5H6.5z" fill={color} stroke="none" opacity="0.92" />
    </svg>
  );
}

function PartlyIco({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="15.5" cy="8.5" r="3.6" fill="#ffd60a" />
      <path d="M5.5 19.5a3.6 3.6 0 0 1-.4-7.2 4.9 4.9 0 0 1 9.6-1.1 3.4 3.4 0 0 1 .8 6.7H5.5z" fill="#e8e8ec" opacity="0.95" />
    </svg>
  );
}

function RainIco({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" strokeLinecap="round">
      <path d="M5.8 14.5a3.8 3.8 0 0 1-.4-7.6 5.2 5.2 0 0 1 10.2-1.2 3.6 3.6 0 0 1 .9 7.1H5.8z" fill="#dfe4ea" />
      <path d="M8 17.5l-1 2.5M12.4 17.5l-1 2.5M16.8 17.5l-1 2.5" stroke="#5ac8fa" strokeWidth={2.1} />
    </svg>
  );
}

function StormIco({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5.8 13.5a3.8 3.8 0 0 1-.4-7.6 5.2 5.2 0 0 1 10.2-1.2 3.6 3.6 0 0 1 .9 7.1H5.8z" fill="#c9ccd4" />
      <path d="M12.2 13.5l-2.6 4h3l-1.6 4.3 4.6-5.2h-3l1.6-3.1z" fill="#ffd60a" stroke="none" />
    </svg>
  );
}

function CondIcon({ cond, size = 26 }: { cond: string; size?: number }) {
  if (cond.includes("Petir")) return <StormIco size={size} />;
  if (cond.includes("Hujan")) return <RainIco size={size} />;
  if (cond.includes("Berawan")) return <PartlyIco size={size} />;
  if (cond.includes("Cerah")) return <SunIco size={size} />;
  return <CloudIco size={size} />;
}

function DropIco({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#5ac8fa">
      <path d="M12 3s6.4 7.2 6.4 11.4A6.4 6.4 0 0 1 5.6 14.4C5.6 10.2 12 3 12 3z" />
    </svg>
  );
}

function WindIco({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#e8e8ec" strokeWidth={2} strokeLinecap="round">
      <path d="M3 8h10.5a2.5 2.5 0 1 0-2.4-3.2M3 12h14.5a2.8 2.8 0 1 1-2.7 3.6M3 16h7.5" />
    </svg>
  );
}

const HUES = [203, 219, 197, 191, 232];

export default function WeatherApp() {
  const t = useT();
  const lang = useSettings((s) => s.lang);
  const [idx, setIdx] = useLocalState<number>("weatherCity", 0);
  const [sheet, setSheet] = useState(false);

  const city = WEATHER_CITIES[clamp(idx, 0, WEATHER_CITIES.length - 1)] ?? WEATHER_CITIES[0];
  const hue = HUES[clamp(idx, 0, HUES.length - 1)];

  const hourly = useMemo(() => {
    const rnd = seededRandom(hashCode(city.name));
    const now = new Date();
    return Array.from({ length: 24 }, (_, i) => {
      const h = (now.getHours() + i) % 24;
      const wave = Math.sin(((h - 8) / 24) * Math.PI * 2);
      const temp = Math.round(city.temp + wave * 4 - 1 + (rnd() - 0.5) * 1.5);
      const cond = i === 0 ? city.cond : [city.cond, city.cond, "Berawan"][Math.floor(rnd() * 3)];
      return { h, temp, cond, first: i === 0 };
    });
  }, [city]);

  const daily = useMemo(() => {
    const rnd = seededRandom(hashCode(city.name) + 7);
    return Array.from({ length: 10 }, (_, i) => {
      const hi = i === 0 ? city.high : Math.round(city.high + (rnd() - 0.5) * 5 - i * 0.2);
      const lo = i === 0 ? city.low : Math.round(city.low + (rnd() - 0.5) * 4 - i * 0.15);
      const cond = [city.cond, city.cond, "Berawan", "Hujan Ringan", "Cerah"][Math.floor(rnd() * 5)];
      return { i, hi, lo: Math.min(lo, hi - 3), cond };
    });
  }, [city]);

  const minT = Math.min(...daily.map((d) => d.lo));
  const maxT = Math.max(...daily.map((d) => d.hi));

  const dayLabel = (offset: number) => {
    if (offset === 0) return t("common.today");
    if (offset === 1) return t("common.tomorrow");
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return translate(lang, `time.days.${d.getDay()}`);
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `linear-gradient(180deg, hsl(${hue},58%,52%) 0%, hsl(${hue + 22},55%,34%) 46%, hsl(${hue + 48},62%,16%) 100%)`,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -140,
          right: -90,
          width: 380,
          height: 380,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,235,180,0.32), transparent 65%)",
          pointerEvents: "none",
        }}
      />
      <div style={{ paddingTop: 62, zIndex: 30, position: "relative" }}>
        <div style={{ height: 44, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 14px" }}>
          <div style={{ width: 36 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 17, fontWeight: 600 }}>
            <LocationPin size={15} strokeWidth={2.2} />
            {city.name}
          </div>
          <button
            onClick={() => {
              Sfx.tick();
              setSheet(true);
            }}
            style={{ color: "#fff", width: 36, display: "flex", justifyContent: "flex-end" }}
          >
            <Ellipsis size={22} strokeWidth={2.2} />
          </button>
        </div>
      </div>

      <div className="scroll-y" style={{ position: "absolute", inset: 0, paddingTop: 116, paddingBottom: 110 }}>
        <div style={{ textAlign: "center", marginTop: 6 }}>
          <div style={{ fontSize: 92, fontWeight: 200, lineHeight: 1, letterSpacing: -4 }}>
            {city.temp}°
          </div>
          <div style={{ fontSize: 20, fontWeight: 500, opacity: 0.92, marginTop: 4 }}>{city.cond}</div>
          <div style={{ fontSize: 17, opacity: 0.85, marginTop: 2 }}>
            {city.high}° / {city.low}°
          </div>
          <div style={{ fontSize: 14.5, opacity: 0.7, marginTop: 9 }}>
            {t("weather.feelsLike")} {city.temp + 2}°
          </div>
        </div>

        <div style={{ margin: "20px 14px 12px", borderRadius: 16, background: "rgba(80,90,130,0.28)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", border: "0.5px solid rgba(255,255,255,0.14)", padding: "12px 14px" }}>
          <div style={{ fontSize: 12.5, opacity: 0.7, display: "flex", alignItems: "center", gap: 5, marginBottom: 10 }}>
            <Sun size={13} strokeWidth={2.2} /> {t("weather.hourly")}
          </div>
          <div className="scroll-x" style={{ display: "flex", gap: 18 }}>
            {hourly.map((h, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7, minWidth: h.first ? 56 : 34 }}>
                <span style={{ fontSize: 13, opacity: 0.85, fontWeight: 600, whiteSpace: "nowrap" }}>
                  {h.first ? t("common.now") : `${h.h}`}
                </span>
                <CondIcon cond={h.cond} size={22} />
                <span style={{ fontSize: 15, fontWeight: 600 }}>{h.temp}°</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ margin: "0 14px 12px", borderRadius: 16, background: "rgba(80,90,130,0.28)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", border: "0.5px solid rgba(255,255,255,0.14)", padding: "12px 14px" }}>
          <div style={{ fontSize: 12.5, opacity: 0.7, marginBottom: 8 }}>{t("weather.daily")}</div>
          {daily.map((d) => (
            <div key={d.i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6.5px 0" }}>
              <span style={{ width: 82, fontSize: 15, fontWeight: 600 }}>{dayLabel(d.i)}</span>
              <div style={{ width: 26, display: "flex", justifyContent: "center" }}>
                <CondIcon cond={d.cond} size={22} />
              </div>
              <span style={{ width: 30, textAlign: "right", fontSize: 15, opacity: 0.62 }}>{d.lo}°</span>
              <div style={{ flex: 1, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.16)", position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    borderRadius: 2,
                    left: `${((d.lo - minT) / (maxT - minT)) * 100}%`,
                    width: `${((d.hi - d.lo) / (maxT - minT)) * 100}%`,
                    background: `linear-gradient(90deg, #5ac8fa, ${d.hi > 29 ? "#ff9f0a" : "#ffd60a"})`,
                  }}
                />
              </div>
              <span style={{ width: 30, fontSize: 15, fontWeight: 600 }}>{d.hi}°</span>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, margin: "0 14px 18px" }}>
          {[
            { icon: <Sun size={18} strokeWidth={2.2} />, label: t("weather.sunrise"), value: "05.48" },
            { icon: <Moon size={18} strokeWidth={2} />, label: t("weather.sunset"), value: "17.52" },
            { icon: <DropIco />, label: t("weather.humidity"), value: `${city.humidity}%` },
            { icon: <WindIco />, label: t("weather.wind"), value: `${city.wind} km/j` },
          ].map((c) => (
            <div
              key={c.label}
              style={{
                borderRadius: 16,
                background: "rgba(80,90,130,0.28)",
                backdropFilter: "blur(18px)",
                WebkitBackdropFilter: "blur(18px)",
                border: "0.5px solid rgba(255,255,255,0.14)",
                padding: "12px 14px",
              }}
            >
              <div style={{ fontSize: 12.5, opacity: 0.7, display: "flex", alignItems: "center", gap: 6 }}>
                {c.icon} {c.label}
              </div>
              <div style={{ fontSize: 26, fontWeight: 600, marginTop: 8 }}>{c.value}</div>
            </div>
          ))}
        </div>
      </div>

      <Sheet open={sheet} onClose={() => setSheet(false)} height={480}>
        <div style={{ padding: "4px 18px 40px" }}>
          <div style={{ fontSize: 17, fontWeight: 700, textAlign: "center", marginBottom: 14 }}>{t("weather.addCity")}</div>
          <div style={{ borderRadius: 14, background: "var(--card)", overflow: "hidden" }}>
            {WEATHER_CITIES.map((c, i) => (
              <button
                key={c.name}
                onClick={() => {
                  Haptics.selection();
                  Sfx.tick();
                  setIdx(i);
                  setSheet(false);
                }}
                className={i > 0 ? "list-sep" : undefined}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "13px 16px",
                  background: i === idx ? "rgba(120,120,128,0.14)" : "transparent",
                }}
              >
                <span style={{ flex: 1, fontSize: 17, fontWeight: i === idx ? 700 : 500, textAlign: "left" }}>{c.name}</span>
                <CondIcon cond={c.cond} size={22} />
                <span style={{ fontSize: 22, fontWeight: 600, width: 52, textAlign: "right" }}>{c.temp}°</span>
              </button>
            ))}
          </div>
        </div>
      </Sheet>
    </div>
  );
}
