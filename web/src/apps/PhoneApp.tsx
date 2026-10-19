import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useT } from "../i18n";
import { useSettings } from "../store/settings";
import { useIsland } from "../store/island";
import { useSystem } from "../store/system";
import { useNotifications } from "../store/notifications";
import { CONTACTS } from "../lib/data";
import { Sfx } from "../lib/sfx";
import { Haptics } from "../lib/haptics";
import { avatarGradient, fmtDurationLong, initials } from "../lib/util";
import { TabBar, PushView, NavBar } from "../components/ui/surfaces";
import { MessageIco, PhoneDown, PhoneIco, VideoCam, Xmark, FaceIDIco } from "../icons/Sys";
import type { Activity, Contact } from "../types";

const KEYS: { d: string; sub?: string }[][] = [
  [{ d: "1" }, { d: "2", sub: "ABC" }, { d: "3", sub: "DEF" }],
  [{ d: "4", sub: "GHI" }, { d: "5", sub: "JKL" }, { d: "6", sub: "MNO" }],
  [{ d: "7", sub: "PQRS" }, { d: "8", sub: "TUV" }, { d: "9", sub: "WXYZ" }],
  [{ d: "*" }, { d: "0", sub: "+" }, { d: "#" }],
];

const DTMF: Record<string, [number, number]> = {
  "1": [697, 1209], "2": [697, 1336], "3": [697, 1477],
  "4": [770, 1209], "5": [770, 1336], "6": [770, 1477],
  "7": [852, 1209], "8": [852, 1336], "9": [852, 1477],
  "*": [941, 1209], "0": [941, 1336], "#": [941, 1477],
};

function Avatar({ contact, size = 44 }: { contact: Contact; size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: avatarGradient(contact.hue),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.36,
        fontWeight: 600,
        color: "#fff",
        flexShrink: 0,
      }}
    >
      {initials(contact.name)}
    </div>
  );
}

function CallUI({ activity }: { activity: Activity }) {
  const t = useT();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, []);
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(false);
  const contact = activity.contact ?? CONTACTS[0];
  const elapsed = activity.startedAt ? Math.floor((now - activity.startedAt) / 1000) : 0;

  const end = () => {
    Haptics.heavy();
    Sfx.error();
    useIsland.getState().removeByKind("call");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 80,
        background: `linear-gradient(180deg, ${avatarGradient(contact.hue)} 0%, #101014 62%, #0a0a0e 100%)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: 108,
        color: "#fff",
      }}
    >
      <div style={{ fontSize: 17, opacity: 0.8 }}>{activity.state === "active" ? t("phone.call") : t("phone.incoming")}</div>
      <div style={{ fontSize: 36, fontWeight: 600, marginTop: 6 }}>{contact.name}</div>
      <div style={{ fontSize: 19, opacity: 0.85, fontVariantNumeric: "tabular-nums", marginTop: 4 }}>
        {activity.state === "active" ? fmtDurationLong(elapsed) : contact.phone}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 84px)", gap: 22, marginTop: 64 }}>
        {[
          { label: t("phone.mute"), on: muted, fn: () => setMuted(!muted), icon: <span style={{ fontSize: 20 }}>{muted ? "🔇" : "🎤"}</span> },
          { label: "Keypad", on: false, fn: () => Sfx.tick(), icon: <span style={{ fontSize: 20 }}>⌨️</span> },
          { label: t("phone.speaker"), on: speaker, fn: () => setSpeaker(!speaker), icon: <span style={{ fontSize: 20 }}>🔊</span> },
          { label: t("phone.addCall"), on: false, fn: () => Sfx.tick(), icon: <span style={{ fontSize: 20 }}>➕</span> },
          { label: t("phone.faceTime"), on: false, fn: () => useSystem.getState().launchApp("facetime"), icon: <VideoCam size={22} color="#fff" /> },
          { label: t("phone.contacts"), on: false, fn: () => Sfx.tick(), icon: <FaceIDIco size={22} color="#fff" /> },
        ].map((b) => (
          <div key={b.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => {
                Haptics.light();
                b.fn();
              }}
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: b.on ? "#fff" : "rgba(255,255,255,0.16)",
                backdropFilter: "blur(20px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 15,
                color: b.on ? "#111" : "#fff",
              }}
            >
              {b.icon}
            </button>
            <span style={{ fontSize: 12.5, opacity: 0.85 }}>{b.label}</span>
          </div>
        ))}
      </div>

      <button
        onClick={end}
        style={{
          marginTop: "auto",
          marginBottom: 60,
          width: 74,
          height: 74,
          borderRadius: "50%",
          background: "#ff453a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <PhoneDown size={32} color="#fff" />
      </button>
    </motion.div>
  );
}

export default function PhoneApp() {
  const t = useT();
  const lang = useSettings((s) => s.lang);
  const [tab, setTab] = useState(2);
  const [digits, setDigits] = useState("");
  const [detail, setDetail] = useState<Contact | null>(null);
  const call = useIsland((s) => s.activities.find((a) => a.kind === "call"));

  const startCall = (contact: Contact) => {
    Haptics.heavy();
    Sfx.click();
    useIsland.getState().add({ kind: "call", contact, state: "active", startedAt: Date.now() });
  };

  const simulateIncoming = () => {
    const c = CONTACTS[Math.floor(Math.random() * CONTACTS.length)];
    Haptics.heavy();
    Sfx.alarm();
    useIsland.getState().add({ kind: "call", contact: c, state: "ringing" });
    useNotifications.getState().push({ app: "phone", title: c.name, body: t("phone.incoming") });
  };

  const calls = CONTACTS.slice(0, 7).map((c, i) => ({
    contact: c,
    dir: i % 3 === 0 ? "out" : i % 4 === 0 ? "missed" : "in",
    time: lang === "id" ? `${i + 1} j lalu` : `${i + 1}h ago`,
  }));

  if (call) {
    return (
      <div style={{ position: "absolute", inset: 0 }}>
        <CallUI activity={call} />
      </div>
    );
  }

  const tabContent = () => {
    if (tab === 0) {
      return (
        <div className="scroll-y" id="app-scroll" style={{ position: "absolute", inset: 0, paddingTop: 158, paddingBottom: 96 }}>
          {calls.map((c) => (
            <div key={c.contact.id} onClick={() => startCall(c.contact)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 20px", cursor: "pointer" }}>
              <div style={{ width: 44, display: "flex", justifyContent: "center", color: c.dir === "missed" ? "#ff453a" : "var(--gray)" }}>
                {c.dir === "out" ? "↗" : c.dir === "missed" ? "↙" : "↙"}
              </div>
              <Avatar contact={c.contact} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 17, fontWeight: 600, color: c.dir === "missed" ? "#ff453a" : undefined }}>{c.contact.name}</div>
                <div style={{ fontSize: 13.5, opacity: 0.55 }}>
                  {c.dir === "missed" ? (lang === "id" ? "Tak terjawab" : "Missed") : c.contact.phone}
                </div>
              </div>
              <span style={{ fontSize: 13, opacity: 0.5 }}>{c.time}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDetail(c.contact);
                }}
                style={{ opacity: 0.4, fontSize: 17 }}
              >
                ⓘ
              </button>
            </div>
          ))}
        </div>
      );
    }
    if (tab === 1) {
      return (
        <div className="scroll-y" id="app-scroll" style={{ position: "absolute", inset: 0, paddingTop: 158, paddingBottom: 96 }}>
          {CONTACTS.map((c) => (
            <div key={c.id} onClick={() => setDetail(c)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 20px", cursor: "pointer" }}>
              <Avatar contact={c} size={40} />
              <div>
                <div style={{ fontSize: 16.5, fontWeight: 500 }}>{c.name}</div>
                <div style={{ fontSize: 13, opacity: 0.5 }}>iPhone · {c.phone}</div>
              </div>
            </div>
          ))}
        </div>
      );
    }
    return (
      <div style={{ position: "absolute", inset: 0, paddingTop: 168, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ fontSize: 34, fontWeight: 500, height: 44, fontVariantNumeric: "tabular-nums", letterSpacing: 1 }}>
          {digits || " "}
        </div>
        <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "repeat(3, 84px)", gap: "14px 26px" }}>
          {KEYS.flat().map((k) => (
            <button
              key={k.d}
              onClick={() => {
                setDigits((d) => (d + k.d).slice(0, 15));
                Sfx.dtmf(DTMF[k.d]);
                Haptics.light();
              }}
              style={{
                width: 84,
                height: 84,
                borderRadius: "50%",
                background: "rgba(120,120,128,0.22)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "inherit",
              }}
            >
              <span style={{ fontSize: 34, fontWeight: 400, lineHeight: 1 }}>{k.d}</span>
              {k.sub && <span style={{ fontSize: 10, letterSpacing: 2, opacity: 0.6, marginTop: 3 }}>{k.sub}</span>}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 34, marginTop: 20 }}>
          <div style={{ width: 84 }} />
          <button
            onClick={() => {
              if (!digits) return;
              const c = CONTACTS.find((x) => x.phone.replace(/\D/g, "").endsWith(digits.slice(-4))) ?? {
                id: "unknown",
                name: digits,
                hue: 200,
                phone: digits,
              };
              startCall(c);
            }}
            style={{ width: 84, height: 84, borderRadius: "50%", background: "#30d158", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <PhoneIco size={34} color="#fff" />
          </button>
          <button onClick={() => setDigits((d) => d.slice(0, -1))} style={{ width: 84, color: "inherit", opacity: digits ? 1 : 0.2 }}>
            <Xmark size={26} strokeWidth={2.2} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ position: "absolute", inset: 0, background: "var(--app-bg)" }}>
      <NavBar
        title={tab === 0 ? t("phone.recents") : tab === 1 ? t("phone.contacts") : t("phone.keypad")}
        right={
          <button onClick={simulateIncoming} style={{ fontSize: 13, color: "var(--blue)", fontWeight: 600 }}>
            {lang === "id" ? "Simulasi Masuk" : "Simulate"}
          </button>
        }
      />
      {tabContent()}
      <TabBar
        tabs={[
          { icon: <PhoneDown size={22} />, label: t("phone.recents") },
          { icon: <FaceIDIco size={22} />, label: t("phone.contacts") },
          { icon: <span style={{ width: 22, height: 22, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700 }}>⌨</span>, label: t("phone.keypad") },
        ]}
        active={tab === 2 ? 2 : tab}
        onChange={setTab}
      />
      {detail && (
        <PushView onClose={() => setDetail(null)}>
          <div className="scroll-y" style={{ position: "absolute", inset: 0, background: "var(--app-bg)" }}>
            <div style={{ paddingTop: 90, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <Avatar contact={detail} size={110} />
              <div style={{ fontSize: 26, fontWeight: 600 }}>{detail.name}</div>
              <div style={{ fontSize: 15, opacity: 0.5 }}>{detail.phone}</div>
            </div>
            <div style={{ display: "flex", gap: 20, justifyContent: "center", marginTop: 26 }}>
              {[
                { icon: <MessageIco size={22} />, label: t("app.messages"), fn: () => useSystem.getState().launchApp("messages") },
                { icon: <PhoneIco size={22} />, label: t("phone.call"), fn: () => startCall(detail) },
                { icon: <VideoCam size={22} />, label: t("phone.faceTime"), fn: () => useSystem.getState().launchApp("facetime") },
              ].map((b) => (
                <button
                  key={b.label}
                  onClick={b.fn}
                  style={{ width: 74, height: 74, borderRadius: 18, background: "var(--card)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5, color: "var(--blue)" }}
                >
                  {b.icon}
                  <span style={{ fontSize: 11 }}>{b.label}</span>
                </button>
              ))}
            </div>
            <div style={{ margin: "26px 16px", borderRadius: 12, background: "var(--card)", padding: "14px 16px" }}>
              <div style={{ fontSize: 13, opacity: 0.5 }}>{lang === "id" ? "Catatan" : "Notes"}</div>
              <div style={{ fontSize: 15, marginTop: 4 }}>{lang === "id" ? "Kontak kerja — proyek v2.3" : "Work contact — v2.3 project"}</div>
            </div>
          </div>
          <button
            onClick={() => setDetail(null)}
            style={{ position: "absolute", top: 70, left: 16, color: "var(--blue)", fontSize: 17, display: "flex", alignItems: "center", gap: 2, zIndex: 10 }}
          >
            ‹ {t("common.back")}
          </button>
        </PushView>
      )}
    </div>
  );
}
