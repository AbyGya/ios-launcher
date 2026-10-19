import { useMemo, useState } from "react";
import { useT, translate } from "../i18n";
import { useSettings } from "../store/settings";
import { EVENTS, todayISO, type EventItem } from "../lib/data";
import { useLocalState } from "../lib/useLocalState";
import { Sfx } from "../lib/sfx";
import { Haptics } from "../lib/haptics";
import { cn, pad2 } from "../lib/util";
import { Sheet } from "../components/ui/surfaces";
import { WheelPicker } from "../components/ui/controls";
import { CalendarIco, ChevronLeft, ChevronRight, Plus, Trash, Xmark } from "../icons/Sys";

const HUES = [350, 30, 280, 140, 200, 60];

function isoOf(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export default function CalendarApp() {
  const t = useT();
  const lang = useSettings((s) => s.lang);
  const [custom, setCustom] = useLocalState<EventItem[]>("eventsCustom", []);
  const today = todayISO(0);
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const [selected, setSelected] = useState(today);
  const [detail, setDetail] = useState<EventItem | null>(null);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(0);

  const all = useMemo(() => [...EVENTS, ...custom], [custom]);

  const byDate = useMemo(() => {
    const map: Record<string, EventItem[]> = {};
    for (const e of all) {
      (map[e.date] ??= []).push(e);
    }
    return map;
  }, [all]);

  const cells = useMemo(() => {
    const first = new Date(cursor.y, cursor.m, 1);
    const startDow = first.getDay();
    const out: { d: number; inMonth: boolean; iso: string }[] = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(cursor.y, cursor.m, i - startDow + 1);
      out.push({ d: date.getDate(), inMonth: date.getMonth() === cursor.m, iso: isoOf(date) });
    }
    return out;
  }, [cursor]);

  const dayEvents = (byDate[selected] ?? []).slice().sort((a, b) => (a.time ?? "99").localeCompare(b.time ?? "99"));
  const selDate = new Date(`${selected}T12:00:00`);
  const selLabel = `${translate(lang, `time.days.${selDate.getDay()}`)}, ${selDate.getDate()} ${translate(lang, `time.months.${selDate.getMonth() + 1}`)}`;

  const monthLabel = `${translate(lang, `time.months.${cursor.m + 1}`)} ${cursor.y}`;

  const nav = (dir: number) => {
    Haptics.selection();
    Sfx.tick();
    setCursor((c) => {
      const d = new Date(c.y, c.m + dir, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  };

  const save = () => {
    if (!title.trim()) return;
    const ev: EventItem = {
      id: `e-${Date.now()}`,
      title: title.trim(),
      date: selected,
      time: `${pad2(hour)}.${pad2(minute)}`,
      hue: HUES[Math.floor(Math.random() * HUES.length)],
      location: location.trim() || undefined,
    };
    setCustom((prev) => [...prev, ev]);
    setAdding(false);
    setTitle("");
    setLocation("");
    Sfx.receive();
    Haptics.success();
  };

  const removeEvent = (e: EventItem) => {
    setCustom((prev) => prev.filter((x) => x.id !== e.id));
    setDetail(null);
    Sfx.whoosh();
    Haptics.success();
  };

  const isCustom = (e: EventItem) => custom.some((c) => c.id === e.id);

  return (
    <div style={{ position: "absolute", inset: 0, background: "var(--app-bg)" }}>
      <div className="scroll-y" id="app-scroll" style={{ position: "absolute", inset: 0, paddingTop: 62, paddingBottom: 110 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 18px 2px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 30, fontWeight: 700, letterSpacing: -0.4 }}>{monthLabel}</span>
            <button onClick={() => nav(-1)} style={{ padding: 6, opacity: 0.8 }}>
              <ChevronLeft size={17} strokeWidth={2.6} />
            </button>
            <button onClick={() => nav(1)} style={{ padding: 6, opacity: 0.8 }}>
              <ChevronRight size={17} strokeWidth={2.6} />
            </button>
          </div>
          <button
            onClick={() => {
              const d = new Date();
              setCursor({ y: d.getFullYear(), m: d.getMonth() });
              setSelected(today);
              Sfx.tick();
              Haptics.light();
            }}
            style={{ color: "var(--blue)", fontSize: 16, fontWeight: 600 }}
          >
            {t("calendar.today")}
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", padding: "10px 8px 2px" }}>
          {[0, 1, 2, 3, 4, 5, 6].map((d) => (
            <div key={d} style={{ textAlign: "center", fontSize: 12, opacity: 0.5, fontWeight: 600, textTransform: "uppercase" }}>
              {translate(lang, `time.daysShort.${d}`)}
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", padding: "0 8px", gridRowGap: 2 }}>
          {cells.map((c) => {
            const evs = byDate[c.iso] ?? [];
            const isToday = c.iso === today;
            const isSel = c.iso === selected;
            return (
              <button
                key={c.iso}
                onClick={() => {
                  setSelected(c.iso);
                  Haptics.light();
                  Sfx.tick();
                }}
                style={{ height: 46, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3 }}
              >
                <span
                  style={{
                    width: 31,
                    height: 31,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    fontWeight: isToday || isSel ? 700 : 400,
                    color: isToday && isSel ? "#fff" : isToday ? "#ff453a" : c.inMonth ? "inherit" : "rgba(150,150,160,0.4)",
                    background: isToday && isSel ? "#ff453a" : isSel ? "rgba(120,120,128,0.35)" : "transparent",
                    opacity: c.inMonth ? 1 : 0.55,
                  }}
                >
                  {c.d}
                </span>
                <span style={{ display: "flex", gap: 2.5, height: 5 }}>
                  {evs.slice(0, 3).map((e) => (
                    <span key={e.id} style={{ width: 4.5, height: 4.5, borderRadius: 5, background: `hsl(${e.hue},75%,58%)` }} />
                  ))}
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ padding: "16px 24px 8px", fontSize: 13, opacity: 0.55, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
          {selLabel}
        </div>

        <div style={{ margin: "0 16px", borderRadius: 12, background: "var(--card)", overflow: "hidden" }}>
          {dayEvents.map((e, i) => (
            <button
              key={e.id}
              onClick={() => {
                Sfx.tick();
                setDetail(e);
              }}
              className={cn(i > 0 && "list-sep")}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", textAlign: "left" }}
            >
              <span style={{ width: 3.5, height: 38, borderRadius: 3, background: `hsl(${e.hue},75%,58%)` }} />
              <div style={{ width: 52 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{e.time ?? t("calendar.allDay")}</div>
                {!e.time && <div style={{ fontSize: 11, opacity: 0.5 }}>{t("calendar.allDay")}</div>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.title}</div>
                {e.location && <div style={{ fontSize: 13, opacity: 0.55, marginTop: 1 }}>{e.location}</div>}
              </div>
              <ChevronRight size={15} style={{ opacity: 0.3 }} />
            </button>
          ))}
          {dayEvents.length === 0 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "36px 0" }}>
              <CalendarIco size={30} color="rgba(140,140,150,0.7)" strokeWidth={1.6} />
              <span style={{ fontSize: 14.5, opacity: 0.45 }}>{t("calendar.noEvents")}</span>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() => {
          setAdding(true);
          Haptics.light();
          Sfx.tick();
        }}
        className="glass"
        style={{
          position: "absolute",
          right: 20,
          bottom: 44,
          width: 52,
          height: 52,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--blue)",
          zIndex: 45,
        }}
      >
        <Plus size={26} strokeWidth={2.2} />
      </button>

      <Sheet open={adding} onClose={() => setAdding(false)} height={560}>
        <div style={{ padding: "4px 18px 40px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <button onClick={() => setAdding(false)} style={{ fontSize: 16.5, color: "var(--blue)" }}>
              {t("common.cancel")}
            </button>
            <span style={{ fontSize: 16, fontWeight: 700 }}>{t("calendar.newEvent")}</span>
            <button onClick={save} style={{ fontSize: 16.5, color: title.trim() ? "var(--blue)" : "rgba(140,140,150,0.6)", fontWeight: 700 }}>
              {t("common.save")}
            </button>
          </div>
          <div style={{ borderRadius: 12, background: "var(--card)", overflow: "hidden", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", padding: "0 14px" }}>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("calendar.titleField")}
                autoFocus
                style={{ flex: 1, fontSize: 16.5, height: 46, color: "inherit" }}
              />
            </div>
            <div className="list-sep" style={{ display: "flex", alignItems: "center", padding: "0 14px" }}>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={t("calendar.location")}
                style={{ flex: 1, fontSize: 16.5, height: 46, color: "inherit" }}
              />
            </div>
          </div>
          <div style={{ borderRadius: 12, background: "var(--card)", padding: "10px 0 6px" }}>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
              <WheelPicker values={Array.from({ length: 24 }, (_, i) => i)} value={hour} onChange={setHour} width={110} />
              <span style={{ fontSize: 24, fontWeight: 700, padding: "0 6px" }}>:</span>
              <WheelPicker values={Array.from({ length: 12 }, (_, i) => i * 5)} value={minute} onChange={setMinute} width={110} />
            </div>
          </div>
        </div>
      </Sheet>

      <Sheet open={!!detail} onClose={() => setDetail(null)}>
        {detail && (
          <div style={{ padding: "4px 18px 44px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
              <span style={{ width: 4, height: 34, borderRadius: 4, background: `hsl(${detail.hue},75%,58%)` }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 19, fontWeight: 700 }}>{detail.title}</div>
                <div style={{ fontSize: 13.5, opacity: 0.55, marginTop: 2 }}>
                  {detail.time ? `${detail.time} · ` : ""}
                  {new Date(`${detail.date}T12:00:00`).getDate()}{" "}
                  {translate(lang, `time.months.${new Date(`${detail.date}T12:00:00`).getMonth() + 1}`)}
                </div>
              </div>
              <button
                onClick={() => setDetail(null)}
                style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(120,120,128,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <Xmark size={14} strokeWidth={2.6} color="rgba(170,170,180,1)" />
              </button>
            </div>
            {detail.location && (
              <div style={{ fontSize: 14.5, opacity: 0.7, margin: "10px 2px 0" }}>{detail.location}</div>
            )}
            {isCustom(detail) && (
              <button
                onClick={() => removeEvent(detail)}
                style={{
                  marginTop: 20,
                  width: "100%",
                  height: 46,
                  borderRadius: 12,
                  background: "rgba(255,69,58,0.14)",
                  color: "#ff453a",
                  fontSize: 16,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <Trash size={18} strokeWidth={2} color="#ff453a" />
                {t("common.delete")}
              </button>
            )}
          </div>
        )}
      </Sheet>
    </div>
  );
}
