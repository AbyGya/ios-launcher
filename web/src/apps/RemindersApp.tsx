import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useT } from "../i18n";
import { useLocalState } from "../lib/useLocalState";
import { DEFAULT_REMINDERS, type ReminderItem } from "../lib/data";
import { Sfx } from "../lib/sfx";
import { Haptics } from "../lib/haptics";
import { cn } from "../lib/util";
import { NavBar, Sheet } from "../components/ui/surfaces";
import { CalendarIco, Check, CheckCircle, GridIco, ListIco, Plus, Trash } from "../icons/Sys";

type Filter = "today" | "scheduled" | "all" | "completed";

export default function RemindersApp() {
  const t = useT();
  const [items, setItems] = useLocalState<ReminderItem[]>("reminders", DEFAULT_REMINDERS);
  const [filter, setFilter] = useState<Filter>("all");
  const [draft, setDraft] = useState("");
  const [editId, setEditId] = useState<string | null>(null);

  const editing = items.find((i) => i.id === editId);

  const isToday = (i: ReminderItem) => (i.due ?? "").toLowerCase() === "hari ini" || i.due === "Today";

  const filtered = items.filter((i) => {
    if (filter === "today") return !i.done && isToday(i);
    if (filter === "scheduled") return !i.done && !!i.due;
    if (filter === "completed") return i.done;
    return !i.done;
  });

  const cards: { id: Filter; label: string; count: number; color: string; icon: React.ReactNode }[] = [
    { id: "today", label: t("reminders.today"), count: items.filter((i) => !i.done && isToday(i)).length, color: "#0a84ff", icon: <ListIco size={19} strokeWidth={2.2} color="#fff" /> },
    { id: "scheduled", label: t("reminders.scheduled"), count: items.filter((i) => !i.done && !!i.due).length, color: "#ff453a", icon: <CalendarIco size={19} color="#fff" strokeWidth={2.2} /> },
    { id: "all", label: t("reminders.all"), count: items.filter((i) => !i.done).length, color: "#8e8e93", icon: <GridIco size={19} strokeWidth={2.2} color="#fff" /> },
    { id: "completed", label: t("reminders.completed"), count: items.filter((i) => i.done).length, color: "#30d158", icon: <CheckCircle size={19} strokeWidth={2.2} color="#fff" /> },
  ];

  const toggle = (id: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));
    const it = items.find((i) => i.id === id);
    if (it && !it.done) {
      Haptics.success();
      Sfx.ding();
    } else {
      Haptics.light();
      Sfx.tick();
    }
  };

  const add = () => {
    if (!draft.trim()) return;
    setItems((prev) => [{ id: `r-${Date.now()}`, title: draft.trim(), done: false, list: "Umum" }, ...prev]);
    setDraft("");
    Sfx.receive();
    Haptics.light();
  };

  const remove = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setEditId(null);
    Sfx.whoosh();
    Haptics.success();
  };

  return (
    <div style={{ position: "absolute", inset: 0, background: "var(--app-bg)" }}>
      <NavBar
        title={t("app.reminders")}
        right={
          <button
            onClick={() => {
              Sfx.tick();
              setFilter("all");
            }}
            style={{ color: "var(--blue)" }}
          >
            <GridIco size={21} strokeWidth={2.2} />
          </button>
        }
      />
      <div className="scroll-y" id="app-scroll" style={{ position: "absolute", inset: 0, paddingTop: 158, paddingBottom: 140 }}>
        <div style={{ display: "flex", gap: 12, padding: "6px 16px 18px" }}>
          {cards.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                Haptics.light();
                Sfx.tick();
                setFilter(c.id);
              }}
              style={{
                flex: 1,
                borderRadius: 14,
                background: "var(--card)",
                padding: "11px 10px",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                alignItems: "flex-start",
                outline: filter === c.id ? "2px solid rgba(255,255,255,0.35)" : "none",
                transition: "outline 0.15s ease",
              }}
            >
              <div style={{ width: 27, height: 27, borderRadius: "50%", background: c.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {c.icon}
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1 }}>{c.count}</div>
                <div style={{ fontSize: 11, opacity: 0.55, marginTop: 3 }}>{c.label}</div>
              </div>
            </button>
          ))}
        </div>

        <div style={{ margin: "0 16px 8px", fontSize: 20, fontWeight: 700 }}>
          {cards.find((c) => c.id === filter)?.label}
        </div>

        <div style={{ margin: "0 16px", borderRadius: 12, background: "var(--card)", overflow: "hidden" }}>
          <AnimatePresence initial={false}>
            {filtered.map((i, idx) => (
              <motion.div
                key={i.id}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: "hidden" }}
              >
                <div
                  className={cn(idx > 0 && "list-sep")}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px" }}
                >
                  <button
                    onClick={() => toggle(i.id)}
                    style={{
                      width: 23,
                      height: 23,
                      borderRadius: "50%",
                      border: i.done ? "none" : "1.6px solid rgba(140,140,150,0.65)",
                      background: i.done ? "#0a84ff" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {i.done && <Check size={13} color="#fff" strokeWidth={3} />}
                  </button>
                  <div
                    onClick={() => {
                      Sfx.tick();
                      setEditId(i.id);
                    }}
                    style={{ flex: 1, cursor: "pointer" }}
                  >
                    <div
                      style={{
                        fontSize: 16.5,
                        textDecoration: i.done ? "line-through" : "none",
                        opacity: i.done ? 0.45 : 1,
                      }}
                    >
                      {i.title}
                    </div>
                    <div style={{ fontSize: 12.5, opacity: 0.45, marginTop: 1 }}>{i.list}</div>
                  </div>
                  {i.due && !i.done && (
                    <span style={{ fontSize: 13, color: isToday(i) ? "#ff9f0a" : "rgba(150,150,160,1)" }}>{i.due}</span>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", opacity: 0.4, marginTop: 60, fontSize: 15 }}>{t("reminders.empty")}</div>
        )}
      </div>

      <div style={{ position: "absolute", left: 16, right: 16, bottom: 40, display: "flex", alignItems: "center", gap: 10, zIndex: 45 }}>
        <div className="glass" style={{ flex: 1, display: "flex", alignItems: "center", borderRadius: 22, height: 44, padding: "0 8px 0 16px" }}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder={t("reminders.placeholder")}
            style={{ flex: 1, fontSize: 16.5, color: "#fff" }}
          />
          {draft.trim() && (
            <button
              onClick={add}
              style={{ width: 30, height: 30, borderRadius: "50%", background: "#0a84ff", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <Plus size={18} strokeWidth={2.6} color="#fff" />
            </button>
          )}
        </div>
      </div>

      <Sheet open={!!editing} onClose={() => setEditId(null)}>
        {editing && (
          <div style={{ padding: "4px 18px 44px" }}>
            <div style={{ fontSize: 17, fontWeight: 700, textAlign: "center", marginBottom: 16 }}>{t("reminders.editTitle")}</div>
            <div className="glass" style={{ borderRadius: 12, padding: "4px 14px", marginBottom: 14 }}>
              <input
                value={editing.title}
                onChange={(e) => setItems((prev) => prev.map((i) => (i.id === editing.id ? { ...i, title: e.target.value } : i)))}
                style={{ width: "100%", fontSize: 17, height: 44, color: "#fff" }}
              />
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {[
                { label: t("reminders.today"), value: t("reminders.today") },
                { label: t("reminders.tomorrow"), value: t("reminders.tomorrow") },
                { label: t("reminders.noDate"), value: undefined },
              ].map((c) => (
                <button
                  key={c.label}
                  onClick={() => {
                    Haptics.selection();
                    Sfx.tick();
                    setItems((prev) => prev.map((i) => (i.id === editing.id ? { ...i, due: c.value } : i)));
                  }}
                  style={{
                    flex: 1,
                    padding: "9px 6px",
                    borderRadius: 11,
                    fontSize: 13.5,
                    fontWeight: 600,
                    background: editing.due === c.value ? "#0a84ff" : "rgba(120,120,128,0.22)",
                    color: editing.due === c.value ? "#fff" : "inherit",
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <div style={{ borderRadius: 12, background: "var(--card)", overflow: "hidden" }}>
              <button
                onClick={() => toggle(editing.id)}
                style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "13px 16px", fontSize: 16.5 }}
              >
                <CheckCircle size={20} strokeWidth={2.2} color={editing.done ? "#30d158" : "#8e8e93"} />
                {editing.done ? t("reminders.markUndone") : t("reminders.markDone")}
              </button>
              <button
                onClick={() => remove(editing.id)}
                className="list-sep"
                style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "13px 16px", fontSize: 16.5, color: "#ff453a" }}
              >
                <Trash size={20} strokeWidth={2} color="#ff453a" />
                {t("common.delete")}
              </button>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}
