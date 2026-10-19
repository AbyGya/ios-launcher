import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useT } from "../i18n";
import { useSettings } from "../store/settings";
import { useIsland } from "../store/island";
import { CONTACTS, AUTO_REPLIES_ID, AUTO_REPLIES_EN } from "../lib/data";
import { useLocalState } from "../lib/useLocalState";
import { Sfx } from "../lib/sfx";
import { Haptics } from "../lib/haptics";
import { avatarGradient, initials, relTime } from "../lib/util";
import { NavBar, PushView, Sheet } from "../components/ui/surfaces";
import { VideoCam, Plus, ChevronRight } from "../icons/Sys";

interface Msg {
  id: string;
  text: string;
  fromMe: boolean;
  ts: number;
}

type Convos = Record<string, Msg[]>;

const DEFAULT_CONVOS: Convos = {
  maya: [
    { id: "1", text: "Bi, jadi nonton nanti malam?", fromMe: false, ts: Date.now() - 7200_000 },
    { id: "2", text: "Jadi dong! Jam 7 ya di XXI", fromMe: true, ts: Date.now() - 7000_000 },
    { id: "3", text: "Oke aku pesen tiketnya dulu 🎬", fromMe: false, ts: Date.now() - 6800_000 },
  ],
  budi: [
    { id: "1", text: "File desainnya udah aku kirim ke email ya", fromMe: false, ts: Date.now() - 86400_000 },
    { id: "2", text: "Sip, thanks Bud! 🙏", fromMe: true, ts: Date.now() - 86000_000 },
  ],
  ibu: [
    { id: "1", text: "Nak, minggu depan pulang kan?", fromMe: false, ts: Date.now() - 172800_000 },
    { id: "2", text: "Iya bu, insyaAllah pulang 🥰", fromMe: true, ts: Date.now() - 172000_000 },
  ],
};

export default function MessagesApp() {
  const t = useT();
  const lang = useSettings((s) => s.lang);
  const [convos, setConvos] = useLocalState<Convos>("convos", DEFAULT_CONVOS);
  const [openId, setOpenId] = useState<string | null>(null);
  const [sheet, setSheet] = useState(false);
  const [typing, setTyping] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const contact = CONTACTS.find((c) => c.id === openId);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [openId, convos, typing]);

  const send = () => {
    if (!openId || !draft.trim()) return;
    const text = draft.trim();
    setDraft("");
    Sfx.send();
    Haptics.light();
    setConvos((prev) => ({
      ...prev,
      [openId]: [...(prev[openId] ?? []), { id: `m${Date.now()}`, text, fromMe: true, ts: Date.now() }],
    }));
    setTyping(openId);
    const delay = 1100 + Math.random() * 1600;
    window.setTimeout(() => {
      setTyping((cur) => (cur === openId ? null : cur));
      const pool = lang === "id" ? AUTO_REPLIES_ID : AUTO_REPLIES_EN;
      const reply = pool[Math.floor(Math.random() * pool.length)];
      setConvos((prev) => ({
        ...prev,
        [openId]: [...(prev[openId] ?? []), { id: `m${Date.now()}`, text: reply, fromMe: false, ts: Date.now() }],
      }));
      Sfx.receive();
      const c = CONTACTS.find((x) => x.id === openId)!;
      const id = useIsland.getState().add({
        kind: "message",
        contact: { id: c.id, name: c.name, hue: c.hue, phone: c.phone },
        body: reply,
      });
      window.setTimeout(() => useIsland.getState().remove(id), 5000);
    }, delay);
  };

  if (contact) {
    const msgs = convos[contact.id] ?? [];
    return (
      <PushView onClose={() => setOpenId(null)}>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", background: "var(--app-bg)" }}>
          <div className="glass" style={{ paddingTop: 62, zIndex: 30 }}>
            <div style={{ height: 46, display: "flex", alignItems: "center", padding: "0 12px", gap: 10 }}>
              <button onClick={() => setOpenId(null)} style={{ color: "var(--blue)", fontSize: 16, display: "flex", alignItems: "center" }}>
                ‹ {t("common.back")}
              </button>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", marginRight: 60 }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: avatarGradient(contact.hue), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: "#fff" }}>
                  {initials(contact.name)}
                </div>
                <span style={{ fontSize: 11.5, marginTop: 2, fontWeight: 500 }}>{contact.name}</span>
              </div>
              <button onClick={() => useIsland.getState().add({ kind: "facetime", contact, state: "active", startedAt: Date.now() })} style={{ color: "var(--blue)" }}>
                <VideoCam size={22} />
              </button>
            </div>
          </div>

          <div ref={scrollRef} className="scroll-y" style={{ flex: 1, padding: "12px 14px 8px", display: "flex", flexDirection: "column", gap: 3 }}>
            <div style={{ textAlign: "center", fontSize: 12.5, opacity: 0.45, padding: "12px 0 18px" }}>
              {lang === "id" ? `iMessage dengan ${contact.name}` : `iMessage with ${contact.name}`}
            </div>
            {msgs.map((m, i) => {
              const prev = msgs[i - 1];
              const grouped = prev && prev.fromMe === m.fromMe && m.ts - prev.ts < 120000;
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 12, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 420, damping: 30 }}
                  style={{ display: "flex", justifyContent: m.fromMe ? "flex-end" : "flex-start", marginTop: grouped ? 2 : 10 }}
                >
                  <div
                    style={{
                      maxWidth: "72%",
                      padding: "9px 14px",
                      borderRadius: 20,
                      background: m.fromMe ? "linear-gradient(180deg,#3aa0ff,#0a7cff)" : "var(--card)",
                      color: m.fromMe ? "#fff" : "inherit",
                      fontSize: 16.5,
                      lineHeight: 1.32,
                      borderBottomRightRadius: m.fromMe ? 6 : 20,
                      borderBottomLeftRadius: m.fromMe ? 20 : 6,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
                    }}
                  >
                    {m.text}
                  </div>
                </motion.div>
              );
            })}
            <AnimatePresence>
              {typing === contact.id && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 14px", borderRadius: 20, background: "var(--card)", width: "fit-content", marginTop: 8 }}
                >
                  {[0, 1, 2].map((i) => (
                    <div key={i} style={{ width: 7, height: 7, borderRadius: 7, background: "var(--gray)", animation: `pulse-dot 1s ${i * 0.15}s infinite` }} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div style={{ padding: "8px 12px 40px", display: "flex", alignItems: "center", gap: 8 }}>
            <button style={{ color: "var(--gray)" }}>
              <Plus size={24} />
            </button>
            <div className="glass" style={{ flex: 1, display: "flex", alignItems: "center", borderRadius: 20, padding: "0 6px 0 14px", height: 38 }}>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder={t("messages.tapToSend")}
                style={{ flex: 1, fontSize: 16.5 }}
              />
              {draft && (
                <button
                  onClick={send}
                  style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--blue)", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="#fff">
                    <path d="M12 4l7 8h-4.5v8h-5v-8H5z" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </PushView>
    );
  }

  const list = CONTACTS.filter((c) => convos[c.id]?.length).sort(
    (a, b) => (convos[b.id]?.at(-1)?.ts ?? 0) - (convos[a.id]?.at(-1)?.ts ?? 0),
  );

  return (
    <div style={{ position: "absolute", inset: 0, background: "var(--app-bg)" }}>
      <NavBar
        title={t("app.messages")}
        right={
          <button onClick={() => setSheet(true)} style={{ color: "var(--blue)" }}>
            <Plus size={24} />
          </button>
        }
      />
      <div className="scroll-y" id="app-scroll" style={{ position: "absolute", inset: 0, paddingTop: 162, paddingBottom: 120 }}>
        {list.map((c) => {
          const last = convos[c.id]?.at(-1);
          return (
            <div
              key={c.id}
              onClick={() => {
                Sfx.tick();
                setOpenId(c.id);
              }}
              style={{ display: "flex", gap: 12, padding: "10px 18px", cursor: "pointer", alignItems: "center" }}
            >
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: avatarGradient(c.hue), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, fontWeight: 600, color: "#fff", flexShrink: 0 }}>
                {initials(c.name)}
              </div>
              <div style={{ flex: 1, minWidth: 0, borderBottom: "0.5px solid rgba(120,120,128,0.25)", paddingBottom: 10, marginTop: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 17, fontWeight: 600 }}>{c.name}</span>
                  <span style={{ fontSize: 13, opacity: 0.5 }}>{relTime(last?.ts ?? Date.now(), lang)}</span>
                </div>
                <div style={{ fontSize: 15, opacity: 0.6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 2 }}>
                  {last?.fromMe ? (lang === "id" ? "Kamu: " : "You: ") : ""}
                  {last?.text}
                </div>
              </div>
            </div>
          );
        })}
        {list.length === 0 && (
          <div style={{ textAlign: "center", opacity: 0.5, marginTop: 80, fontSize: 15 }}>{t("mail.noMessage")}</div>
        )}
      </div>

      <Sheet open={sheet} onClose={() => setSheet(false)}>
        <div style={{ padding: "6px 18px 40px" }}>
          <div style={{ textAlign: "center", fontSize: 17, fontWeight: 700, marginBottom: 14 }}>{t("messages.newMessage")}</div>
          {CONTACTS.map((c) => (
            <div
              key={c.id}
              onClick={() => {
                setSheet(false);
                setOpenId(c.id);
              }}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 4px", cursor: "pointer" }}
            >
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: avatarGradient(c.hue), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 600, color: "#fff" }}>
                {initials(c.name)}
              </div>
              <span style={{ flex: 1, fontSize: 16.5, fontWeight: 500 }}>{c.name}</span>
              <ChevronRight size={16} style={{ opacity: 0.3 }} />
            </div>
          ))}
        </div>
      </Sheet>
    </div>
  );
}
