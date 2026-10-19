import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useT } from "../i18n";
import { useSettings } from "../store/settings";
import { useLocalState } from "../lib/useLocalState";
import { WALLET_TXS } from "../lib/data";
import { Sfx } from "../lib/sfx";
import { Haptics } from "../lib/haptics";
import { relTime } from "../lib/util";
import { NavBar, PushView, Sheet, showAlert } from "../components/ui/surfaces";
import { ChevronRight, Eye, Plus, Star } from "../icons/Sys";

interface Card {
  id: string;
  name: string;
  last4: string;
  hue: number;
  balance: number;
}

const SEED_CARDS: Card[] = [
  { id: "c1", name: "Bank Nusa", last4: "8812", hue: 218, balance: 2450000 },
  { id: "c2", name: "Kartu Kredit Visa", last4: "4291", hue: 345, balance: -1250000 },
];

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

function Chip() {
  return (
    <svg width="30" height="24" viewBox="0 0 30 24" fill="none">
      <rect x="1" y="1" width="28" height="22" rx="4" stroke="rgba(255,255,255,0.55)" strokeWidth="1.4" />
      <path d="M1 8h9M1 16h9M20 8h9M20 16h9M10 1v22M20 1v22" stroke="rgba(255,255,255,0.55)" strokeWidth="1" />
    </svg>
  );
}

function CardFace({ card, compact }: { card: Card; compact?: boolean }) {
  return (
    <div
      style={{
        height: compact ? 168 : 214,
        borderRadius: 18,
        background: `linear-gradient(135deg, hsl(${card.hue},72%,52%), hsl(${card.hue - 28},78%,30%))`,
        padding: compact ? "16px 18px" : "20px 22px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        color: "#fff",
        boxShadow: "0 14px 34px rgba(0,0,0,0.35)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: 0.6 }}>NUSA</span>
        <Chip />
      </div>
      <div>
        <div style={{ fontSize: 12, opacity: 0.75, letterSpacing: 1.5, textTransform: "uppercase" }}>{card.name}</div>
        <div style={{ fontSize: 21, fontWeight: 600, letterSpacing: 2.4, marginTop: 6, fontVariantNumeric: "tabular-nums" }}>
          •••• •••• •••• {card.last4}
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <span style={{ fontSize: 12.5, opacity: 0.85, letterSpacing: 1 }}>ABI GUNAWAN</span>
        <div style={{ display: "flex" }}>
          <div style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(255,255,255,0.85)" }} />
          <div style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(255,255,255,0.45)", marginLeft: -9 }} />
        </div>
      </div>
    </div>
  );
}

export default function WalletApp() {
  const t = useT();
  const lang = useSettings((s) => s.lang);
  const [cards, setCards] = useLocalState<Card[]>("walletCards", SEED_CARDS);
  const [selId, setSelId] = useState(cards[0]?.id ?? "c1");
  const [hideBal, setHideBal] = useState(true);
  const [sheet, setSheet] = useState(false);
  const [push, setPush] = useState(false);
  const [form, setForm] = useState({ name: "", num: "" });

  const sel = cards.find((c) => c.id === selId) ?? cards[0];

  const pay = () => {
    Haptics.success();
    Sfx.pay();
    void showAlert({ title: t("wallet.paid"), message: `${sel?.name} • ${rupiah(125000)}`, buttons: [t("common.ok")] });
  };

  const addCard = () => {
    const digits = form.num.replace(/\D/g, "");
    const card: Card = {
      id: `c${Date.now()}`,
      name: form.name.trim() || t("wallet.debit"),
      last4: (digits.slice(-4) || String(1000 + Math.floor(Math.random() * 9000))).padStart(4, "0"),
      hue: [190, 25, 280, 140, 320][cards.length % 5],
      balance: 500000,
    };
    setCards((prev) => [...prev, card]);
    setSelId(card.id);
    setSheet(false);
    setForm({ name: "", num: "" });
    Haptics.success();
    Sfx.ding();
  };

  return (
    <div style={{ position: "absolute", inset: 0, background: "var(--app-bg)" }}>
      <div className="scroll-y" id="app-scroll" style={{ position: "absolute", inset: 0, paddingTop: 0, paddingBottom: 110 }}>
        <NavBar
          title={t("wallet.title")}
          right={
            <button onClick={() => { setSheet(true); Sfx.tick(); }} style={{ color: "var(--blue)" }}>
              <Plus size={22} strokeWidth={2.2} />
            </button>
          }
        />

        <div style={{ position: "relative", height: 168 + Math.max(0, cards.length - 1) * 62, margin: "6px 20px 0" }}>
          {cards
            .filter((c) => c.id !== sel?.id)
            .map((c, j) => (
              <motion.div
                key={c.id}
                onClick={() => {
                  setSelId(c.id);
                  Haptics.selection();
                  Sfx.tick();
                }}
                animate={{ top: j * 62 }}
                transition={{ type: "spring", stiffness: 380, damping: 34 }}
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: j * 62,
                  zIndex: 10 + j,
                  cursor: "pointer",
                  height: 62,
                  overflow: "hidden",
                  borderRadius: "18px 18px 0 0",
                }}
              >
                <CardFace card={c} compact />
              </motion.div>
            ))}
          {sel && (
            <motion.div
              key={sel.id}
              animate={{ top: Math.max(0, cards.length - 1) * 62 }}
              transition={{ type: "spring", stiffness: 380, damping: 34 }}
              style={{ position: "absolute", left: 0, right: 0, zIndex: 40, height: 168, overflow: "hidden", borderRadius: 18 }}
            >
              <CardFace card={sel} compact />
            </motion.div>
          )}
        </div>

        <div style={{ margin: "18px 20px 0", borderRadius: 14, background: "var(--card)", padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, opacity: 0.55, textTransform: "uppercase", letterSpacing: 0.4 }}>{t("wallet.balance")}</span>
            <button
              onClick={() => {
                setHideBal((v) => !v);
                Haptics.light();
                Sfx.tick();
              }}
              style={{ color: "rgba(150,150,160,1)" }}
            >
              <Eye size={16} strokeWidth={2} />
            </button>
          </div>
          <div style={{ fontSize: 30, fontWeight: 700, marginTop: 4, fontVariantNumeric: "tabular-nums" }}>
            {hideBal ? "Rp ••••••" : rupiah(sel?.balance ?? 0)}
          </div>
          <button
            onClick={pay}
            style={{
              marginTop: 14,
              width: "100%",
              height: 46,
              borderRadius: 23,
              background: "var(--blue)",
              color: "#fff",
              fontSize: 16,
              fontWeight: 700,
            }}
          >
            {t("wallet.pay")}
          </button>
        </div>

        <div style={{ padding: "20px 26px 7px", fontSize: 13, fontWeight: 600, opacity: 0.55, textTransform: "uppercase", letterSpacing: 0.5 }}>
          {t("wallet.transactions")}
        </div>
        <div style={{ margin: "0 16px", borderRadius: 12, background: "var(--card)", overflow: "hidden" }}>
          {WALLET_TXS.map((tx, i) => (
            <div key={tx.id} className={i > 0 ? "list-sep" : undefined} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px" }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 11,
                  background: `linear-gradient(180deg, hsl(${tx.hue},72%,56%), hsl(${tx.hue},74%,42%))`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  fontWeight: 800,
                  color: "#fff",
                  flexShrink: 0,
                }}
              >
                {tx.title[0]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15.5, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{tx.title}</div>
                <div style={{ fontSize: 12.5, opacity: 0.5 }}>
                  {tx.place} · {relTime(tx.ts, lang)}
                </div>
              </div>
              <span style={{ fontSize: 15, fontWeight: 600, color: tx.amount > 0 ? "#30d158" : "var(--label)", fontVariantNumeric: "tabular-nums" }}>
                {tx.amount > 0 ? "+" : "−"}{rupiah(Math.abs(tx.amount)).replace("Rp", "Rp ")}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={() => {
            setPush(true);
            Sfx.tick();
          }}
          className="list-sep"
          style={{
            margin: "20px 16px 0",
            width: "calc(100% - 32px)",
            borderRadius: 12,
            background: "var(--card)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "13px 16px",
            fontSize: 15.5,
          }}
        >
          <Star size={17} strokeWidth={2} style={{ fill: "#ffd60a", color: "#ffd60a" }} />
          <span style={{ flex: 1, textAlign: "left" }}>{t("wallet.cards")} · {t("common.add")}</span>
          <ChevronRight size={15} strokeWidth={2.4} style={{ opacity: 0.4 }} />
        </button>
      </div>

      <AnimatePresence>
        {push && (
          <PushView onClose={() => setPush(false)}>
            <NavBar title={t("wallet.debit")} large={false} onBack={() => setPush(false)} />
            <div className="scroll-y" style={{ position: "absolute", inset: 0, paddingTop: 106, paddingBottom: 60 }}>
              <div style={{ padding: "10px 16px" }}>
                {cards.map((c) => (
                  <div key={c.id} style={{ marginBottom: 14 }}>
                    <CardFace card={c} />
                    <div style={{ fontSize: 12.5, opacity: 0.5, textAlign: "center", marginTop: 8 }}>
                      {t("wallet.holder")}: ABI GUNAWAN
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </PushView>
        )}
      </AnimatePresence>

      <Sheet open={sheet} onClose={() => setSheet(false)} height={430}>
        <div style={{ padding: "4px 18px 36px" }}>
          <div style={{ textAlign: "center", fontSize: 17, fontWeight: 700, marginBottom: 18 }}>{t("wallet.addCard")}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="glass" style={{ height: 46, borderRadius: 12, display: "flex", alignItems: "center", padding: "0 14px" }}>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder={t("wallet.cardName")}
                style={{ flex: 1, fontSize: 16, color: "inherit" }}
              />
            </div>
            <div className="glass" style={{ height: 46, borderRadius: 12, display: "flex", alignItems: "center", padding: "0 14px" }}>
              <input
                value={form.num}
                inputMode="numeric"
                onChange={(e) => {
                  const d = e.target.value.replace(/\D/g, "").slice(0, 16);
                  setForm((f) => ({ ...f, num: d.replace(/(.{4})/g, "$1 ").trim() }));
                }}
                placeholder="0000 0000 0000 0000"
                style={{ flex: 1, fontSize: 16, color: "inherit", letterSpacing: 1.5, fontVariantNumeric: "tabular-nums" }}
              />
            </div>
            <button
              onClick={addCard}
              style={{ marginTop: 8, height: 48, borderRadius: 24, background: "var(--blue)", color: "#fff", fontSize: 16.5, fontWeight: 700 }}
            >
              {t("common.add")}
            </button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
