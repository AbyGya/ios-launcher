import { useState } from "react";
import { motion } from "framer-motion";
import { useT } from "../i18n";
import { useSettings } from "../store/settings";
import { useNotifications } from "../store/notifications";
import { MAILS, AUTO_REPLIES_ID, AUTO_REPLIES_EN, type MailItem } from "../lib/data";
import { useLocalState } from "../lib/useLocalState";
import { Sfx } from "../lib/sfx";
import { Haptics } from "../lib/haptics";
import { avatarGradient, initials } from "../lib/util";
import { NavBar, PushView, Sheet } from "../components/ui/surfaces";
import { ChevronLeft, ChevronRight, Ellipsis, MailIco, PencilIco, SendIco, Star, Trash } from "../icons/Sys";

type Box = "inbox" | "vip" | "sent" | "drafts" | "trash";

export default function MailApp() {
  const t = useT();
  const lang = useSettings((s) => s.lang);
  const [items, setItems] = useLocalState<MailItem[]>("mailItems", MAILS);
  const [sent, setSent] = useLocalState<MailItem[]>("mailSent", []);
  const [trash, setTrash] = useLocalState<MailItem[]>("mailTrash", []);
  const [box, setBox] = useState<Box | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [compose, setCompose] = useState(false);
  const [reply, setReply] = useState("");
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const unread = items.filter((m) => m.unread).length;
  const open = items.find((m) => m.id === openId) ?? sent.find((m) => m.id === openId) ?? trash.find((m) => m.id === openId);

  const boxItems = (b: Box): MailItem[] =>
    b === "inbox" ? items : b === "vip" ? items.filter((m) => m.vip) : b === "sent" ? sent : b === "trash" ? trash : [];

  const openMail = (m: MailItem) => {
    Sfx.tick();
    setOpenId(m.id);
    if (m.unread) setItems((prev) => prev.map((x) => (x.id === m.id ? { ...x, unread: false } : x)));
  };

  const moveToTrash = (m: MailItem) => {
    setItems((prev) => prev.filter((x) => x.id !== m.id));
    setSent((prev) => prev.filter((x) => x.id !== m.id));
    setTrash((prev) => [{ ...m, unread: false }, ...prev]);
    setOpenId(null);
    Sfx.whoosh();
    Haptics.success();
  };

  const restore = (m: MailItem) => {
    setTrash((prev) => prev.filter((x) => x.id !== m.id));
    setItems((prev) => [{ ...m }, ...prev]);
    setOpenId(null);
    Sfx.receive();
    Haptics.success();
  };

  const sendReply = () => {
    if (!reply.trim() || !open) return;
    const txt = reply.trim();
    setReply("");
    Sfx.send();
    Haptics.light();
    setSent((prev) => [
      {
        id: `s-${Date.now()}`,
        from: "abi@icloud.com",
        name: "Abi",
        subject: `Re: ${open.subject}`,
        preview: txt,
        body: [txt],
        time: "Baru saja",
        unread: false,
        hue: 210,
      },
      ...prev,
    ]);
    const sender = open;
    window.setTimeout(() => {
      const pool = lang === "id" ? AUTO_REPLIES_ID : AUTO_REPLIES_EN;
      const text = pool[Math.floor(Math.random() * pool.length)];
      const replyMsg: MailItem = {
        id: `m-${Date.now()}`,
        from: sender.from,
        name: sender.name,
        subject: `Re: ${sender.subject}`,
        preview: text,
        body: [text, sender.name],
        time: "Baru saja",
        unread: true,
        hue: sender.hue,
        vip: sender.vip,
      };
      setItems((prev) => [replyMsg, ...prev]);
      Sfx.receive();
      useNotifications.getState().push({ app: "mail", title: sender.name, body: text });
    }, 2400);
  };

  const sendCompose = () => {
    if (!to.trim() || !body.trim()) return;
    setSent((prev) => [
      {
        id: `s-${Date.now()}`,
        from: "abi@icloud.com",
        name: "Abi",
        subject: subject.trim() || "(Tanpa Subjek)",
        preview: body.trim(),
        body: [body.trim()],
        time: "Baru saja",
        unread: false,
        hue: 210,
      },
      ...prev,
    ]);
    setCompose(false);
    setTo("");
    setSubject("");
    setBody("");
    Sfx.send();
    Haptics.success();
  };

  if (open) {
    const fromTrash = trash.some((x) => x.id === open.id);
    const fromSent = sent.some((x) => x.id === open.id);
    return (
      <PushView onClose={() => setOpenId(null)} bg="var(--app-bg)">
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", background: "var(--app-bg)" }}>
          <div className="glass" style={{ paddingTop: 62, zIndex: 30 }}>
            <div style={{ height: 46, display: "flex", alignItems: "center", padding: "0 12px", gap: 14 }}>
              <button
                onClick={() => {
                  Sfx.tick();
                  setOpenId(null);
                }}
                style={{ color: "var(--blue)", display: "flex", alignItems: "center", fontSize: 17 }}
              >
                <ChevronLeft size={24} strokeWidth={2.2} />
                {t(box === "sent" ? "mail.sent" : box === "trash" ? "mail.trash" : box === "vip" ? "mail.vip" : "mail.inbox")}
              </button>
              <div style={{ flex: 1 }} />
              {fromTrash ? (
                <>
                  <button onClick={() => restore(open)} style={{ color: "var(--blue)", fontSize: 15.5 }}>
                    {t("mail.restore")}
                  </button>
                  <button onClick={() => moveToTrash(open)} style={{ color: "#ff453a" }}>
                    <Trash size={20} strokeWidth={2} />
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => moveToTrash(open)} style={{ color: "var(--blue)" }}>
                    <Trash size={20} strokeWidth={2} />
                  </button>
                  <button style={{ color: "var(--blue)" }}>
                    <Ellipsis size={21} strokeWidth={2.2} />
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="scroll-y" style={{ flex: 1, padding: "14px 20px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: avatarGradient(open.hue), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                {initials(open.name)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{fromSent ? t("mail.to") + " " + open.name : open.name}</div>
                <div style={{ fontSize: 13, opacity: 0.55, marginTop: 1 }}>{open.from}</div>
              </div>
              <span style={{ fontSize: 13, opacity: 0.5 }}>{open.time}</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.3, marginBottom: 16, lineHeight: 1.25 }}>{open.subject}</div>
            {open.body.map((p, i) => (
              <p key={i} style={{ fontSize: 16.5, lineHeight: 1.5, marginBottom: 14, whiteSpace: "pre-line", opacity: 0.92 }}>
                {p}
              </p>
            ))}
          </div>
          {!fromSent && !fromTrash && (
            <div style={{ padding: "8px 14px 40px", display: "flex", alignItems: "center", gap: 10 }}>
              <div className="glass" style={{ flex: 1, display: "flex", alignItems: "center", borderRadius: 20, height: 40, padding: "0 8px 0 16px" }}>
                <input
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendReply()}
                  placeholder={t("mail.reply") + "..."}
                  style={{ flex: 1, fontSize: 16, color: "inherit" }}
                />
                {reply.trim() && (
                  <button
                    onClick={sendReply}
                    style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--blue)", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <SendIco size={15} color="#fff" strokeWidth={2.2} />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </PushView>
    );
  }

  if (box) {
    const list = boxItems(box);
    return (
      <PushView onClose={() => setBox(null)}>
        <div style={{ position: "absolute", inset: 0, background: "var(--app-bg)" }}>
          <div className="glass" style={{ paddingTop: 62, zIndex: 30 }}>
            <div style={{ height: 46, display: "flex", alignItems: "center", padding: "0 12px" }}>
              <button
                onClick={() => {
                  Sfx.tick();
                  setBox(null);
                }}
                style={{ color: "var(--blue)", display: "flex", alignItems: "center", fontSize: 17, width: 84 }}
              >
                <ChevronLeft size={24} strokeWidth={2.2} />
                {t("app.mail")}
              </button>
              <div style={{ flex: 1, textAlign: "center", fontSize: 16, fontWeight: 600 }}>
                {t(box === "sent" ? "mail.sent" : box === "trash" ? "mail.trash" : box === "vip" ? "mail.vip" : "mail.inbox")}
              </div>
              <div style={{ width: 84, display: "flex", justifyContent: "flex-end" }}>
                {box === "sent" && (
                  <button onClick={() => setCompose(true)} style={{ color: "var(--blue)" }}>
                    <PencilIco size={20} strokeWidth={2} />
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="scroll-y" id="app-scroll" style={{ position: "absolute", inset: 0, paddingTop: 118, paddingBottom: 90 }}>
            {list.map((m, i) => (
              <button
                key={m.id}
                onClick={() => openMail(m)}
                className={i > 0 ? "list-sep" : undefined}
                style={{ width: "100%", display: "flex", gap: 11, alignItems: "center", padding: "11px 16px", textAlign: "left" }}
              >
                <div style={{ width: 8, display: "flex", justifyContent: "center", flexShrink: 0 }}>
                  {m.unread && <span style={{ width: 8, height: 8, borderRadius: 8, background: "var(--blue)" }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ fontSize: 16.5, fontWeight: m.unread ? 700 : 500 }}>{m.name}</span>
                    <span style={{ fontSize: 13, opacity: 0.5, flexShrink: 0, marginLeft: 8 }}>{m.time}</span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: m.unread ? 600 : 400, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {m.subject}
                  </div>
                  <div style={{ fontSize: 14, opacity: 0.5, marginTop: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {m.preview}
                  </div>
                </div>
                <ChevronRight size={15} style={{ opacity: 0.3, flexShrink: 0 }} />
              </button>
            ))}
            {list.length === 0 && (
              <div style={{ textAlign: "center", opacity: 0.4, marginTop: 70, fontSize: 15 }}>{t("mail.noMessage")}</div>
            )}
          </div>
          {box === "inbox" && (
            <button
              onClick={() => {
                setCompose(true);
                Haptics.light();
                Sfx.tick();
              }}
              className="glass"
              style={{ position: "absolute", right: 20, bottom: 44, width: 52, height: 52, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--blue)", zIndex: 45 }}
            >
              <PencilIco size={23} strokeWidth={2} />
            </button>
          )}
        </div>
      </PushView>
    );
  }

  const rows: { id: Box; label: string; icon: React.ReactNode; color: string; count?: number }[] = [
    { id: "inbox", label: t("mail.inbox"), icon: <MailIco size={19} strokeWidth={2.1} color="#fff" />, color: "#0a84ff", count: unread },
    { id: "vip", label: t("mail.vip"), icon: <Star size={19} strokeWidth={2.1} color="#fff" />, color: "#ff9f0a" },
    { id: "sent", label: t("mail.sent"), icon: <SendIco size={18} strokeWidth={2.1} color="#fff" />, color: "#30d158" },
    { id: "trash", label: t("mail.trash"), icon: <Trash size={19} strokeWidth={2} color="#fff" />, color: "#8e8e93" },
  ];

  return (
    <div style={{ position: "absolute", inset: 0, background: "var(--app-bg)" }}>
      <NavBar
        title={t("app.mail")}
        right={
          <button onClick={() => setCompose(true)} style={{ color: "var(--blue)" }}>
            <PencilIco size={22} strokeWidth={2} />
          </button>
        }
      />
      <div className="scroll-y" id="app-scroll" style={{ position: "absolute", inset: 0, paddingTop: 162, paddingBottom: 120 }}>
        <div style={{ padding: "0 32px 7px", fontSize: 13, opacity: 0.55, textTransform: "uppercase", letterSpacing: 0.6 }}>
          {t("mail.inbox")}
        </div>
        <div style={{ margin: "0 16px", borderRadius: 12, background: "var(--card)", overflow: "hidden" }}>
          {rows.map((r, i) => (
            <button
              key={r.id}
              onClick={() => {
                Sfx.tick();
                setBox(r.id);
              }}
              className={i > 0 ? "list-sep" : undefined}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 13, padding: "12px 16px", textAlign: "left" }}
            >
              <div style={{ width: 29, height: 29, borderRadius: 8, background: r.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {r.icon}
              </div>
              <span style={{ flex: 1, fontSize: 17, fontWeight: 500 }}>{r.label}</span>
              {!!r.count && <span style={{ fontSize: 17, opacity: 0.5 }}>{r.count}</span>}
              <ChevronRight size={15} style={{ opacity: 0.3 }} />
            </button>
          ))}
        </div>

        <div style={{ padding: "24px 32px 7px", fontSize: 13, opacity: 0.55, textTransform: "uppercase", letterSpacing: 0.6 }}>
          {t("mail.inbox")} · {items.slice(0, 3).length}
        </div>
        <div style={{ margin: "0 16px", borderRadius: 12, background: "var(--card)", overflow: "hidden" }}>
          {items.slice(0, 3).map((m, i) => (
            <button
              key={m.id}
              onClick={() => {
                setBox("inbox");
                openMail(m);
              }}
              className={i > 0 ? "list-sep" : undefined}
              style={{ width: "100%", display: "flex", gap: 11, alignItems: "center", padding: "11px 16px", textAlign: "left" }}
            >
              <div style={{ width: 8, display: "flex", justifyContent: "center", flexShrink: 0 }}>
                {m.unread && <span style={{ width: 8, height: 8, borderRadius: 8, background: "var(--blue)" }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 16, fontWeight: m.unread ? 700 : 500 }}>{m.name}</span>
                  <span style={{ fontSize: 12.5, opacity: 0.5 }}>{m.time}</span>
                </div>
                <div style={{ fontSize: 14.5, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.subject}</div>
                <div style={{ fontSize: 13.5, opacity: 0.5, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.preview}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <Sheet open={compose} onClose={() => setCompose(false)} height="86%">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: "4px 18px 30px", display: "flex", flexDirection: "column", height: "calc(100% - 20px)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <button onClick={() => setCompose(false)} style={{ fontSize: 16.5, color: "var(--blue)" }}>
              {t("common.cancel")}
            </button>
            <span style={{ fontSize: 16, fontWeight: 700 }}>{t("mail.newMessage")}</span>
            <button
              onClick={sendCompose}
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: to.trim() && body.trim() ? "var(--blue)" : "rgba(120,120,128,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.2s ease",
              }}
            >
              <SendIco size={17} color="#fff" strokeWidth={2.2} />
            </button>
          </div>
          <div style={{ borderRadius: 12, background: "var(--card)", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", padding: "0 14px", borderBottom: "0.5px solid rgba(120,120,128,0.3)" }}>
              <span style={{ fontSize: 16.5, opacity: 0.5, width: 52 }}>{t("mail.to")}</span>
              <input value={to} onChange={(e) => setTo(e.target.value)} style={{ flex: 1, fontSize: 16.5, height: 46, color: "inherit" }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", padding: "0 14px" }}>
              <span style={{ fontSize: 16.5, opacity: 0.5, width: 52 }}>{t("mail.subject")}</span>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} style={{ flex: 1, fontSize: 16.5, height: 46, color: "inherit" }} />
            </div>
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={t("mail.compose") + "..."}
            style={{ flex: 1, marginTop: 14, fontSize: 16.5, lineHeight: 1.5, resize: "none", color: "inherit" }}
          />
        </motion.div>
      </Sheet>

      <button
        onClick={() => {
          setCompose(true);
          Haptics.light();
          Sfx.tick();
        }}
        className="glass"
        style={{ position: "absolute", right: 20, bottom: 140, width: 52, height: 52, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--blue)", zIndex: 45 }}
      >
        <PencilIco size={23} strokeWidth={2} />
      </button>

    </div>
  );
}
