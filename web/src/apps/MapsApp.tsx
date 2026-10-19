import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useT } from "../i18n";
import { MAP_PLACES, type MapPlace } from "../lib/data";
import { Sfx } from "../lib/sfx";
import { Haptics } from "../lib/haptics";
import { showAlert } from "../components/ui/surfaces";
import { SearchBar } from "../components/ui/controls";
import { LocationArrow, LocationPin, Star, Xmark } from "../icons/Sys";
import { useIsland } from "../store/island";

const USER = { x: 50, y: 72 };

function toPx(x: number, y: number) {
  return { px: (x / 100) * 440, py: (y / 100) * 956 };
}

export default function MapsApp() {
  const t = useT();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<MapPlace | null>(null);
  const [phase, setPhase] = useState<"browse" | "preview" | "active">("browse");
  const [eta, setEta] = useState(0);
  const [step, setStep] = useState(0);
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((id) => window.clearInterval(id));
    timers.current = [];
  };

  useEffect(() => () => clearTimers(), []);

  const filtered = query
    ? MAP_PLACES.filter((p) => (p.name + p.category).toLowerCase().includes(query.toLowerCase()))
    : MAP_PLACES;

  const startRoute = () => {
    if (!selected) return;
    const mins = Math.max(2, Math.round(parseFloat(selected.distance) * 2.4) || 4);
    setEta(mins);
    setStep(0);
    setPhase("preview");
    Sfx.tick();
  };

  const go = () => {
    if (!selected) return;
    setPhase("active");
    Sfx.whoosh();
    Haptics.medium();
    const id = useIsland.getState().add({
      kind: "delivery",
      title: `${t("maps.routeTo")} ${selected.name}`,
      body: `${t("maps.driving")} · ${selected.distance}`,
      progress: eta,
      status: 0,
    });
    let s = 0;
    const iv = window.setInterval(() => {
      s += 1;
      setStep(s);
      useIsland.getState().update(id, { status: s, progress: Math.max(1, eta - s) });
      Sfx.tick();
      if (s >= 2) {
        window.clearInterval(iv);
        window.setTimeout(() => {
          useIsland.getState().remove(id);
          setPhase("browse");
          setSelected(null);
          Sfx.ding();
          Haptics.success();
          void showAlert({ title: t("maps.arrived"), message: selected.name, buttons: [t("common.ok")] });
        }, 1400);
      }
    }, 2300);
    timers.current.push(iv);
  };

  const cancel = () => {
    useIsland.getState().removeByKind("delivery");
    clearTimers();
    setPhase("browse");
    setSelected(null);
    Sfx.whoosh();
    Haptics.light();
  };

  const userPx = toPx(USER.x, USER.y);
  const selPx = selected ? toPx(selected.x, selected.y) : null;

  return (
    <div style={{ position: "absolute", inset: 0, background: "#1d1f24", overflow: "hidden" }}>
      <svg viewBox="0 0 440 956" width="100%" height="100%" style={{ position: "absolute", inset: 0 }} preserveAspectRatio="none">
        <rect width="440" height="956" fill="#24262c" />
        <g fill="#2b2e34">
          <rect x="16" y="60" width="86" height="120" rx="10" />
          <rect x="130" y="40" width="120" height="90" rx="10" />
          <rect x="300" y="70" width="110" height="140" rx="10" />
          <rect x="40" y="260" width="130" height="100" rx="10" />
          <rect x="250" y="290" width="90" height="80" rx="10" />
          <rect x="360" y="300" width="70" height="120" rx="10" />
          <rect x="60" y="430" width="100" height="90" rx="10" />
          <rect x="300" y="470" width="120" height="100" rx="10" />
          <rect x="30" y="600" width="120" height="110" rx="10" />
          <rect x="240" y="640" width="100" height="90" rx="10" />
          <rect x="80" y="790" width="140" height="90" rx="10" />
          <rect x="330" y="800" width="90" height="100" rx="10" />
        </g>
        <ellipse cx="205" cy="180" rx="55" ry="38" fill="#1e2c20" />
        <ellipse cx="395" cy="560" rx="58" ry="80" fill="#1e2c20" />
        <path d="M0 760 C 110 720, 210 880, 440 810 L 440 956 L 0 956 Z" fill="#16263e" />
        <g stroke="#383c44" strokeWidth="12" strokeLinecap="round" fill="none">
          <path d="M110 0 L110 956" />
          <path d="M330 0 L330 700" />
          <path d="M0 300 L440 320" />
          <path d="M0 620 L440 600" />
        </g>
        <g stroke="#454a54" strokeWidth="18" strokeLinecap="round" fill="none">
          <path d="M0 130 C 160 150, 250 90, 440 110" />
          <path d="M220 0 L230 956" />
        </g>
        <path d="M120 730 L 340 560" stroke="#33373f" strokeWidth="9" strokeLinecap="round" />
      </svg>

      <div style={{ position: "absolute", top: 0, left: 0, right: 0, paddingTop: 62, zIndex: 30 }}>
        <div style={{ padding: "8px 14px" }}>
          <SearchBar value={query} onChange={setQuery} placeholder={t("maps.searchPlaceholder")} />
        </div>
      </div>

      {selPx && phase !== "browse" && (
        <svg viewBox="0 0 440 956" width="100%" height="100%" style={{ position: "absolute", inset: 0, pointerEvents: "none" }} preserveAspectRatio="none">
          <path
            d={`M ${userPx.px} ${userPx.py} C ${userPx.px + 30} ${userPx.py - 60}, ${selPx.px - 40} ${selPx.py + 80}, ${selPx.px} ${selPx.py}`}
            fill="none"
            stroke="rgba(10,132,255,0.35)"
            strokeWidth="12"
            strokeLinecap="round"
          />
          <path
            d={`M ${userPx.px} ${userPx.py} C ${userPx.px + 30} ${userPx.py - 60}, ${selPx.px - 40} ${selPx.py + 80}, ${selPx.px} ${selPx.py}`}
            fill="none"
            stroke="#0a84ff"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray="10 14"
          >
            <animate attributeName="stroke-dashoffset" from="24" to="0" dur="1.1s" repeatCount="indefinite" />
          </path>
        </svg>
      )}

      <div style={{ position: "absolute", left: `${USER.x}%`, top: `${USER.y}%`, transform: "translate(-50%,-50%)", zIndex: 20, pointerEvents: "none" }}>
        <svg width="52" height="52" viewBox="0 0 52 52">
          <circle cx="26" cy="26" r="10" fill="rgba(10,132,255,0.22)">
            <animate attributeName="r" values="10;24;10" dur="2.4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.9;0;0.9" dur="2.4s" repeatCount="indefinite" />
          </circle>
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ width: 17, height: 17, borderRadius: "50%", background: "#0a84ff", border: "3px solid #fff", boxShadow: "0 2px 10px rgba(0,0,0,0.5)" }} />
        </div>
      </div>

      {MAP_PLACES.map((p) => {
        const active = selected?.id === p.id;
        return (
          <button
            key={p.id}
            onClick={() => {
              Haptics.light();
              Sfx.tick();
              setSelected(p);
              setPhase("browse");
            }}
            style={{
              position: "absolute",
              left: `${p.x}%`,
              top: `${p.y}%`,
              transform: `translate(-50%,-100%) scale(${active ? 1.18 : 1})`,
              zIndex: active ? 25 : 15,
              transition: "transform 0.2s cubic-bezier(0.3,1.4,0.5,1)",
              filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.45))",
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: "50% 50% 50% 4px",
                transform: "rotate(-45deg)",
                background: active ? "#0a84ff" : "#ff453a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid rgba(255,255,255,0.9)",
              }}
            >
              <div style={{ transform: "rotate(45deg)", color: "#fff", display: "flex" }}>
                <LocationPin size={14} strokeWidth={2.4} color="#fff" />
              </div>
            </div>
          </button>
        );
      })}

      <button
        onClick={() => {
          Haptics.light();
          Sfx.tick();
        }}
        className="glass"
        style={{
          position: "absolute",
          right: 16,
          bottom: phase === "browse" && !selected ? 300 : 250,
          width: 44,
          height: 44,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#0a84ff",
          zIndex: 40,
          transition: "bottom 0.3s ease",
        }}
      >
        <LocationArrow size={22} strokeWidth={2.2} />
      </button>

      <div
        className="glass-strong"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: "20px 20px 0 0",
          paddingBottom: 40,
          zIndex: 45,
          background: "rgba(28,28,32,0.86)",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
        }}
      >
        <div style={{ width: 40, height: 5, borderRadius: 3, background: "rgba(150,150,155,0.5)", margin: "9px auto 5px" }} />
        <AnimatePresence mode="wait" initial={false}>
          {selected ? (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 14 }}
              transition={{ duration: 0.18 }}
              style={{ padding: "8px 18px 2px" }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 21, fontWeight: 700, letterSpacing: -0.3 }}>{selected.name}</div>
                  <div style={{ fontSize: 13.5, opacity: 0.6, marginTop: 3 }}>
                    {selected.category} · {selected.distance} · ★ {selected.rating}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelected(null);
                    setPhase("browse");
                    Sfx.tick();
                  }}
                  style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(120,120,128,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <Xmark size={14} strokeWidth={2.6} color="rgba(170,170,180,1)" />
                </button>
              </div>

              {phase === "browse" && (
                <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                  <button
                    onClick={startRoute}
                    style={{
                      flex: 1,
                      height: 46,
                      borderRadius: 23,
                      background: "#0a84ff",
                      color: "#fff",
                      fontSize: 16,
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 7,
                    }}
                  >
                    <LocationArrow size={19} strokeWidth={2.2} />
                    {t("maps.directions")}
                  </button>
                </div>
              )}

              {phase === "preview" && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontSize: 26, fontWeight: 700, color: "#30d158" }}>{eta} mnt</span>
                    <span style={{ fontSize: 14, opacity: 0.6 }}>{selected.distance} · {t("maps.driving")}</span>
                  </div>
                  <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                    <button
                      onClick={go}
                      style={{ flex: 1, height: 46, borderRadius: 23, background: "#30d158", color: "#fff", fontSize: 16, fontWeight: 700 }}
                    >
                      {t("maps.go")}
                    </button>
                    <button
                      onClick={cancel}
                      style={{ width: 46, height: 46, borderRadius: 23, background: "rgba(120,120,128,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      <Xmark size={18} strokeWidth={2.4} />
                    </button>
                  </div>
                </div>
              )}

              {phase === "active" && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: "#30d158" }}>{Math.max(1, eta - step)} mnt</div>
                      <div style={{ fontSize: 13, opacity: 0.6 }}>{t("maps.driving")}</div>
                    </div>
                    <button
                      onClick={cancel}
                      style={{ height: 42, padding: "0 22px", borderRadius: 21, background: "#ff453a", color: "#fff", fontSize: 15, fontWeight: 700 }}
                    >
                      {t("common.close")}
                    </button>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", marginTop: 16 }}>
                    {[0, 1, 2].map((i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", flex: i < 2 ? 1 : 0 }}>
                        <div
                          style={{
                            width: 13,
                            height: 13,
                            borderRadius: 13,
                            background: step >= i ? "#30d158" : "rgba(255,255,255,0.2)",
                            transition: "background 0.4s ease",
                          }}
                        />
                        {i < 2 && (
                          <div style={{ flex: 1, height: 3, margin: "0 7px", borderRadius: 2, background: step > i ? "#30d158" : "rgba(255,255,255,0.2)", transition: "background 0.4s ease" }} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <div style={{ padding: "7px 26px 7px", fontSize: 13, opacity: 0.55, textTransform: "uppercase", letterSpacing: 0.6 }}>
                {query ? t("common.search") : t("maps.favorites")}
              </div>
              <div className="scroll-y" style={{ maxHeight: 230, padding: "0 10px" }}>
                {filtered.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      Haptics.light();
                      Sfx.tick();
                      setSelected(p);
                    }}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 8px", textAlign: "left" }}
                  >
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background: "rgba(120,120,128,0.22)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#ff453a",
                        flexShrink: 0,
                      }}
                    >
                      <LocationPin size={19} strokeWidth={2} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 16, fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontSize: 13, opacity: 0.55, marginTop: 1 }}>
                        {p.category} · {p.distance}
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 3, marginLeft: 8, color: "#ffd60a" }}>
                          <Star size={11} strokeWidth={2.4} color="#ffd60a" style={{ fill: "#ffd60a" }} /> {p.rating}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
                {filtered.length === 0 && (
                  <div style={{ textAlign: "center", opacity: 0.45, padding: "34px 0 44px", fontSize: 15 }}>{t("spotlight.noResult")}</div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
