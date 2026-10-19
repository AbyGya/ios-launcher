import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useT } from "../i18n";
import { useSettings } from "../store/settings";
import { useIsland } from "../store/island";
import { CONTACTS } from "../lib/data";
import type { Contact } from "../types";
import { Sfx } from "../lib/sfx";
import { Haptics } from "../lib/haptics";
import { avatarGradient, initials, relTime } from "../lib/util";
import { NavBar, Sheet } from "../components/ui/surfaces";
import { Magnifier, Mic, PhoneDown, Plus, VideoCam } from "../icons/Sys";

const RECENT = [
  { contact: CONTACTS[0], ts: Date.now() - 1800_000, video: true },
  { contact: CONTACTS[3], ts: Date.now() - 5 * 3600_000, video: false },
  { contact: CONTACTS[1], ts: Date.now() - 26 * 3600_000, video: true },
];

export default function FaceTimeApp() {
  const t = useT();
  const lang = useSettings((s) => s.lang);
  const [sheet, setSheet] = useState(false);
  const [call, setCall] = useState<Contact | null>(null);
  const [phase, setPhase] = useState<"connecting" | "ringing" | "active">("connecting");
  const [elapsed, setElapsed] = useState(0);
  const [muted, setMuted] = useState(false);
  const [facing, setFacing] = useState<"user" | "environment">("user");
  const [camOk, setCamOk] = useState<boolean | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const islandIdRef = useRef<string | null>(null);
  const callRef = useRef<Contact | null>(null);
  const phaseRef = useRef(phase);

  useEffect(() => {
    callRef.current = call;
  }, [call]);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    const unsub = useIsland.subscribe(() => {
      if (callRef.current && phaseRef.current === "active") {
        const act = useIsland.getState().getByKind("facetime");
        if (!act) {
          endCall();
          return;
        }
        setMuted(!!act.muted);
        const tr = streamRef.current?.getVideoTracks()[0];
        if (tr) tr.enabled = !act.muted;
      }
    });
    return () => {
      unsub();
      cleanupMedia();
      if (islandIdRef.current) useIsland.getState().remove(islandIdRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (phase !== "active" || !call) return;
    const started = Date.now();
    const iv = window.setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 500);
    return () => window.clearInterval(iv);
  }, [phase, call]);

  const cleanupMedia = () => {
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
  };

  const attachCam = async (mode: "user" | "environment") => {
    cleanupMedia();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: mode }, audio: false });
      streamRef.current = stream;
      const tr = stream.getVideoTracks()[0];
      if (tr) tr.enabled = !muted;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        void videoRef.current.play().catch(() => undefined);
      }
      setCamOk(true);
    } catch {
      setCamOk(false);
    }
  };

  useEffect(() => {
    if (call && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      void videoRef.current.play().catch(() => undefined);
    }
  }, [call]);

  const startCall = (c: Contact) => {
    setCall(c);
    setPhase("connecting");
    setElapsed(0);
    setMuted(false);
    setFacing("user");
    setCamOk(null);
    setSheet(false);
    Sfx.ding();
    Haptics.medium();
    void attachCam("user");
    window.setTimeout(() => phaseRef.current === "connecting" && callRef.current && setPhase("ringing"), 1300);
    window.setTimeout(() => {
      if (callRef.current) {
        setPhase("active");
        islandIdRef.current = useIsland.getState().add({
          kind: "facetime",
          contact: c,
          state: "active",
          startedAt: Date.now(),
        });
        Sfx.receive();
        Haptics.success();
      }
    }, 3200);
  };

  const endCall = () => {
    if (!callRef.current) return;
    callRef.current = null;
    setCall(null);
    setPhase("connecting");
    cleanupMedia();
    if (islandIdRef.current) {
      useIsland.getState().remove(islandIdRef.current);
      islandIdRef.current = null;
    }
    Sfx.whoosh();
    Haptics.medium();
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    const tr = streamRef.current?.getVideoTracks()[0];
    if (tr) tr.enabled = !next;
    if (islandIdRef.current) useIsland.getState().update(islandIdRef.current, { muted: next });
    Haptics.light();
    Sfx.tick();
  };

  const flip = () => {
    const next = facing === "user" ? "environment" : "user";
    setFacing(next);
    Haptics.light();
    Sfx.tick();
    void attachCam(next);
  };

  const stateLabel = phase === "connecting" ? t("facetime.connecting") : phase === "ringing" ? t("facetime.ringing") : `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;

  return (
    <div style={{ position: "absolute", inset: 0, background: "var(--app-bg)" }}>
      <div className="scroll-y" id="app-scroll" style={{ position: "absolute", inset: 0, paddingTop: 0, paddingBottom: 110 }}>
        <NavBar
          title={t("facetime.title")}
          right={
            <button
              onClick={() => {
                setSheet(true);
                Sfx.tick();
              }}
              style={{ color: "var(--blue)" }}
            >
              <Plus size={22} strokeWidth={2.2} />
            </button>
          }
        />

        <button
          onClick={() => {
            setSheet(true);
            Sfx.tick();
          }}
          style={{ display: "flex", width: "calc(100% - 32px)", margin: "4px 16px 0", borderRadius: 14, background: "var(--card)", padding: "14px 16px", alignItems: "center", gap: 12, textAlign: "left" }}
        >
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(120,120,128,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Magnifier size={17} strokeWidth={2.2} style={{ opacity: 0.7 }} />
          </div>
          <span style={{ fontSize: 16.5, flex: 1 }}>{t("facetime.newCall")}</span>
          <VideoCam size={20} strokeWidth={2} color="var(--blue)" />
        </button>

        <div style={{ padding: "22px 26px 7px", fontSize: 13, fontWeight: 600, opacity: 0.55, textTransform: "uppercase", letterSpacing: 0.5 }}>
          {t("facetime.recent")}
        </div>
        <div style={{ margin: "0 16px", borderRadius: 12, background: "var(--card)", overflow: "hidden" }}>
          {RECENT.map((r, i) => (
            <div key={r.contact.id} className={i > 0 ? "list-sep" : undefined} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px" }}>
              <button onClick={() => startCall(r.contact)} style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0, textAlign: "left" }}>
                <div style={{ width: 38, height: 38, borderRadius: "50%", background: avatarGradient(r.contact.hue), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                  {initials(r.contact.name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15.5, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.contact.name}</div>
                  <div style={{ fontSize: 12.5, opacity: 0.5, display: "flex", alignItems: "center", gap: 5 }}>
                    <VideoCam size={12} strokeWidth={2} style={{ opacity: 0.7 }} />
                    {t("facetime.title")} · {relTime(r.ts, lang)}
                  </div>
                </div>
              </button>
              <button
                onClick={() => startCall(r.contact)}
                style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(48,209,88,0.16)", display: "flex", alignItems: "center", justifyContent: "center", color: "#30d158" }}
              >
                <VideoCam size={18} strokeWidth={2.1} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {call && (
          <motion.div
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ position: "absolute", inset: 0, zIndex: 80, background: "#000", overflow: "hidden" }}
          >
            <div style={{ position: "absolute", inset: 0, background: avatarGradient(call.hue), opacity: 0.92 }} />
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
              <div
                style={{
                  width: 132,
                  height: 132,
                  borderRadius: "50%",
                  background: "rgba(0,0,0,0.24)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 44,
                  fontWeight: 700,
                  color: "#fff",
                  animation: phase !== "active" ? "breathe 1.6s infinite" : undefined,
                }}
              >
                {initials(call.name)}
              </div>
            </div>

            <div style={{ position: "absolute", top: 74, left: 0, right: 0, textAlign: "center", color: "#fff", pointerEvents: "none" }}>
              <div style={{ fontSize: 26, fontWeight: 700, textShadow: "0 2px 14px rgba(0,0,0,0.4)" }}>{call.name}</div>
              <div style={{ fontSize: 15, opacity: 0.85, marginTop: 4, fontVariantNumeric: "tabular-nums" }}>{stateLabel}</div>
            </div>

            <div style={{ position: "absolute", right: 16, bottom: 208, width: 112, height: 158, borderRadius: 18, overflow: "hidden", background: "rgba(30,30,34,0.9)", border: "1px solid rgba(255,255,255,0.14)" }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transform: facing === "user" ? "scaleX(-1)" : undefined,
                  display: camOk === false ? "none" : "block",
                }}
              />
              {camOk === false && (
                <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <VideoCam size={26} strokeWidth={1.8} color="rgba(255,255,255,0.4)" />
                  <span style={{ fontSize: 10.5, color: "rgba(255,255,255,0.45)", textAlign: "center", padding: "0 8px" }}>{t("facetime.denied")}</span>
                </div>
              )}
            </div>

            <div style={{ position: "absolute", left: 0, right: 0, bottom: 52, display: "flex", justifyContent: "center", gap: 30 }}>
              <button
                onClick={toggleMute}
                style={{ width: 66, height: 66, borderRadius: "50%", background: muted ? "#fff" : "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(12px)" }}
              >
                <Mic size={26} color={muted ? "#000" : "#fff"} strokeWidth={2} />
              </button>
              <button
                onClick={flip}
                style={{ width: 66, height: 66, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(12px)" }}
              >
                <VideoCam size={26} color="#fff" strokeWidth={2} />
              </button>
              <button
                onClick={endCall}
                style={{ width: 66, height: 66, borderRadius: "50%", background: "#ff453a", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <PhoneDown size={28} color="#fff" />
              </button>
            </div>
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 24, display: "flex", justifyContent: "center", gap: 46, color: "rgba(255,255,255,0.75)", fontSize: 11.5 }}>
              <span style={{ width: 66, textAlign: "center" }}>{t("facetime.mute")}</span>
              <span style={{ width: 66, textAlign: "center" }}>{t("facetime.flip")}</span>
              <span style={{ width: 66, textAlign: "center" }}>{t("facetime.end")}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Sheet open={sheet} onClose={() => setSheet(false)} height="78%">
        <div style={{ padding: "4px 0 40px", height: "calc(100% - 20px)", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "0 18px 12px", fontSize: 17, fontWeight: 700, textAlign: "center" }}>{t("facetime.newCall")}</div>
          <div className="scroll-y" style={{ flex: 1 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "20px 8px", padding: "8px 18px 20px" }}>
              {CONTACTS.map((c) => (
                <button key={c.id} onClick={() => startCall(c)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7 }}>
                  <div style={{ width: 68, height: 68, borderRadius: "50%", background: avatarGradient(c.hue), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700 }}>
                    {initials(c.name)}
                  </div>
                  <span style={{ fontSize: 12, textAlign: "center", lineHeight: 1.25 }}>{c.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
