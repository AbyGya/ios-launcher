import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useT } from "../i18n";
import { useLocalState } from "../lib/useLocalState";
import { Sfx } from "../lib/sfx";
import { Haptics } from "../lib/haptics";
import { Sheet, showAlert } from "../components/ui/surfaces";
import { Bookmark, ChevronLeft, ChevronRight, Ellipsis, LockIco, Plus, Share, Xmark } from "../icons/Sys";

interface Tab {
  id: string;
  url: string;
  title: string;
  hist: string[];
  hi: number;
  priv: boolean;
}

interface Fav {
  name: string;
  url: string;
  hue: number;
}

const FAVS: Fav[] = [
  { name: "Wikipedia", url: "https://id.wikipedia.org/wiki/Indonesia", hue: 0 },
  { name: "Example", url: "https://example.com", hue: 210 },
  { name: "Info CERN", url: "https://info.cern.ch", hue: 280 },
  { name: "Berita", url: "https://news.example.com", hue: 140 },
];

const READING = [
  { name: "Sejarah Internet — Wikipedia", url: "https://id.wikipedia.org/wiki/Sejarah_Internet" },
  { name: "Dokumentasi MDN — CSS Grid", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout" },
];

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function titleOf(url: string): string {
  const h = hostOf(url);
  const part = h.split(".")[0] ?? h;
  return part.charAt(0).toUpperCase() + part.slice(1);
}

export default function SafariApp() {
  const t = useT();
  const [tabs, setTabs] = useState<Tab[]>([{ id: "t1", url: "", title: "", hist: [], hi: -1, priv: false }]);
  const [activeId, setActiveId] = useState("t1");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [sheet, setSheet] = useState<"tabs" | "share" | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [bookmarks, setBookmarks] = useLocalState<{ url: string; title: string }[]>("bookmarks", []);
  const failTimer = useRef<number | null>(null);

  const tab = tabs.find((x) => x.id === activeId) ?? tabs[0];

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
    if (!tab.url) return;
    if (failTimer.current) window.clearTimeout(failTimer.current);
    failTimer.current = window.setTimeout(() => {
      setLoaded((ok) => {
        if (!ok) setFailed(true);
        return ok;
      });
    }, 4500);
    return () => {
      if (failTimer.current) window.clearTimeout(failTimer.current);
    };
  }, [tab.url]);

  const patch = (id: string, p: Partial<Tab>) => setTabs((prev) => prev.map((x) => (x.id === id ? { ...x, ...p } : x)));

  const go = (raw: string) => {
    let url = raw.trim();
    if (!url) return;
    if (!/^https?:\/\//.test(url)) {
      url = url.includes(".") && !url.includes(" ") ? `https://${url}` : `https://www.bing.com/search?q=${encodeURIComponent(url)}`;
    }
    const hist = [...tab.hist.slice(0, tab.hi + 1), url];
    patch(tab.id, { url, title: titleOf(url), hist, hi: hist.length - 1 });
    setEditing(false);
    setDraft("");
    Sfx.whoosh();
    Haptics.light();
  };

  const back = () => {
    if (tab.hi <= 0) return;
    const hi = tab.hi - 1;
    patch(tab.id, { hi, url: tab.hist[hi], title: titleOf(tab.hist[hi]) });
    Sfx.tick();
  };
  const fwd = () => {
    if (tab.hi >= tab.hist.length - 1) return;
    const hi = tab.hi + 1;
    patch(tab.id, { hi, url: tab.hist[hi], title: titleOf(tab.hist[hi]) });
    Sfx.tick();
  };

  const newTab = (priv = false) => {
    const id = `t-${Date.now()}`;
    setTabs((prev) => [...prev, { id, url: "", title: "", hist: [], hi: -1, priv }]);
    setActiveId(id);
    setSheet(null);
    Sfx.tick();
  };

  const closeTab = (id: string) => {
    setTabs((prev) => {
      const next = prev.filter((x) => x.id !== id);
      if (next.length === 0) {
        const nid = `t-${Date.now()}`;
        setActiveId(nid);
        return [{ id: nid, url: "", title: "", hist: [], hi: -1, priv: false }];
      }
      if (id === activeId) setActiveId(next[next.length - 1].id);
      return next;
    });
    Sfx.whoosh();
  };

  const isBookmarked = bookmarks.some((b) => b.url === tab.url);

  const toggleBookmark = () => {
    if (!tab.url) return;
    Haptics.light();
    Sfx.tick();
    setBookmarks((prev) => (isBookmarked ? prev.filter((b) => b.url !== tab.url) : [...prev, { url: tab.url, title: tab.title || hostOf(tab.url) }]));
  };

  const accent = tab.priv ? "#bf5af2" : "var(--blue)";

  const toolbar = (
    <div style={{ position: "absolute", left: 8, right: 8, bottom: 34, zIndex: 50 }}>
      {!editing ? (
        <div className="glass-strong" style={{ display: "flex", alignItems: "center", gap: 2, borderRadius: 26, height: 52, padding: "0 6px", background: tab.priv ? "rgba(40,32,52,0.82)" : undefined }}>
          <button onClick={back} disabled={tab.hi <= 0} style={{ width: 40, height: 44, display: "flex", alignItems: "center", justifyContent: "center", opacity: tab.hi > 0 ? 1 : 0.3 }}>
            <ChevronLeft size={21} strokeWidth={2.4} />
          </button>
          <button onClick={fwd} disabled={tab.hi >= tab.hist.length - 1} style={{ width: 34, height: 44, display: "flex", alignItems: "center", justifyContent: "center", opacity: tab.hi < tab.hist.length - 1 ? 1 : 0.3 }}>
            <ChevronRight size={21} strokeWidth={2.4} />
          </button>
          <button
            onClick={() => {
              setDraft(tab.url);
              setEditing(true);
            }}
            style={{ flex: 1, height: 34, borderRadius: 17, background: "rgba(120,120,128,0.18)", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, fontSize: 14.5, minWidth: 0, padding: "0 12px" }}
          >
            {tab.url ? (
              <>
                <LockIco size={12} strokeWidth={2.2} style={{ opacity: 0.6 }} />
                <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{hostOf(tab.url)}</span>
              </>
            ) : (
              <span style={{ opacity: 0.55 }}>{t("safari.urlPlaceholder")}</span>
            )}
          </button>
          <button
            onClick={() => {
              setSheet("share");
              Sfx.tick();
            }}
            style={{ width: 38, height: 44, display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <Share size={19} strokeWidth={2} />
          </button>
          <button
            onClick={() => {
              setSheet("tabs");
              Sfx.tick();
            }}
            style={{ width: 42, height: 44, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", color: accent }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <rect x="6" y="3.5" width="14" height="14" rx="3" />
              <path d="M4 7v10.5A3.5 3.5 0 0 0 7.5 21H18" />
            </svg>
            <span style={{ position: "absolute", bottom: 4, fontSize: 10, fontWeight: 700 }}>{tabs.length}</span>
          </button>
        </div>
      ) : (
        <div className="glass-strong" style={{ display: "flex", alignItems: "center", gap: 8, borderRadius: 26, height: 52, padding: "0 14px" }}>
          <input
            value={draft}
            autoFocus
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && go(draft)}
            placeholder={t("safari.urlPlaceholder")}
            style={{ flex: 1, fontSize: 16, color: "inherit" }}
          />
          <button
            onClick={() => {
              setEditing(false);
              setDraft("");
            }}
            style={{ fontSize: 16, color: accent, fontWeight: 500 }}
          >
            {t("common.cancel")}
          </button>
        </div>
      )}
    </div>
  );

  const startPage = (
    <div className="scroll-y" style={{ position: "absolute", inset: 0, paddingTop: 74, paddingBottom: 150 }}>
      {tab.priv ? (
        <div style={{ padding: "60px 34px" }}>
          <div style={{ width: 54, height: 54, borderRadius: 16, background: "rgba(191,90,242,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <LockIco size={26} color="#bf5af2" strokeWidth={2} />
          </div>
          <div style={{ fontSize: 25, fontWeight: 700, marginTop: 18 }}>{t("safari.privateMode")}</div>
          <div style={{ fontSize: 15, opacity: 0.6, marginTop: 8, lineHeight: 1.45 }}>{t("safari.privateBody")}</div>
        </div>
      ) : (
        <>
          <div style={{ padding: "8px 24px 8px", fontSize: 13, fontWeight: 600, opacity: 0.55, textTransform: "uppercase", letterSpacing: 0.5 }}>
            {t("safari.favorites")}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "18px 8px", padding: "6px 18px 20px" }}>
            {FAVS.map((f) => (
              <button key={f.name} onClick={() => go(f.url)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{ width: 58, height: 58, borderRadius: 14, background: `linear-gradient(180deg, hsl(${f.hue},62%,56%), hsl(${f.hue},64%,40%))`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800, color: "#fff" }}>
                  {f.name[0]}
                </div>
                <span style={{ fontSize: 11.5, opacity: 0.85 }}>{f.name}</span>
              </button>
            ))}
          </div>

          {bookmarks.length > 0 && (
            <>
              <div style={{ padding: "8px 26px 7px", fontSize: 13, fontWeight: 600, opacity: 0.55, textTransform: "uppercase", letterSpacing: 0.5 }}>
                {t("safari.bookmarks")}
              </div>
              <div style={{ margin: "0 16px", borderRadius: 12, background: "var(--card)", overflow: "hidden" }}>
                {bookmarks.map((b, i) => (
                  <button key={b.url} onClick={() => go(b.url)} className={i > 0 ? "list-sep" : undefined} style={{ width: "100%", display: "flex", alignItems: "center", gap: 11, padding: "11px 14px", textAlign: "left" }}>
                    <Bookmark size={17} color="var(--blue)" strokeWidth={2.2} style={{ fill: "var(--blue)", flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 15.5, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.title}</div>
                      <div style={{ fontSize: 12.5, opacity: 0.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{hostOf(b.url)}</div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          <div style={{ padding: "20px 26px 7px", fontSize: 13, fontWeight: 600, opacity: 0.55, textTransform: "uppercase", letterSpacing: 0.5 }}>
            {t("safari.reading")}
          </div>
          <div style={{ margin: "0 16px", borderRadius: 12, background: "var(--card)", overflow: "hidden" }}>
            {READING.map((r, i) => (
              <button key={r.url} onClick={() => go(r.url)} className={i > 0 ? "list-sep" : undefined} style={{ width: "100%", display: "flex", alignItems: "center", gap: 11, padding: "11px 14px", textAlign: "left" }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(120,120,128,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, opacity: 0.8, flexShrink: 0 }}>
                  {hostOf(r.url).slice(0, 2).toUpperCase()}
                </div>
                <div style={{ fontSize: 15, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.name}</div>
              </button>
            ))}
          </div>

          <div style={{ margin: "24px 16px", borderRadius: 12, background: "var(--card)", padding: "13px 16px", display: "flex", alignItems: "center", gap: 12 }}>
            <LockIco size={19} strokeWidth={2.2} style={{ opacity: 0.8 }} />
            <span style={{ fontSize: 15, fontWeight: 500, flex: 1 }}>{t("safari.privacy")}</span>
            <span style={{ fontSize: 14, opacity: 0.5 }}>17</span>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div style={{ position: "absolute", inset: 0, background: tab.priv ? "#000" : "var(--app-bg)", overflow: "hidden" }}>
      {tab.url ? (
        <div style={{ position: "absolute", inset: 0, paddingTop: 62, paddingBottom: 0 }}>
          <AnimatePresence mode="wait">
            <motion.div key={tab.url} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} style={{ position: "absolute", inset: 0, top: 62 }}>
              {!failed ? (
                <>
                  <iframe
                    src={tab.url}
                    title="safari-page"
                    onLoad={() => setLoaded(true)}
                    style={{ width: "100%", height: "100%", border: "none", background: "#fff" }}
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  />
                  {!loaded && (
                    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, background: "var(--app-bg)" }}>
                      <div className="spinner" />
                      <span style={{ fontSize: 14, opacity: 0.5 }}>{hostOf(tab.url)}</span>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 40px", textAlign: "center", background: "var(--app-bg)" }}>
                  <div style={{ width: 62, height: 62, borderRadius: 18, background: "rgba(120,120,128,0.2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                    <LockIco size={30} strokeWidth={1.8} style={{ opacity: 0.7 }} />
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 700 }}>{hostOf(tab.url)}</div>
                  <div style={{ fontSize: 14.5, opacity: 0.6, marginTop: 8, lineHeight: 1.45 }}>{t("safari.cannotEmbed")}</div>
                  <button
                    onClick={() => {
                      window.open(tab.url, "_blank", "noopener");
                      Sfx.tick();
                    }}
                    style={{ marginTop: 22, height: 44, padding: "0 26px", borderRadius: 22, background: accent, color: "#fff", fontSize: 15.5, fontWeight: 600 }}
                  >
                    {t("safari.openExternal")}
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      ) : (
        startPage
      )}

      {toolbar}

      <Sheet open={sheet === "tabs"} onClose={() => setSheet(null)} height="72%">
        <div style={{ padding: "4px 16px 40px", display: "flex", flexDirection: "column", height: "calc(100% - 20px)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <button onClick={() => setSheet(null)} style={{ fontSize: 16.5, color: accent, fontWeight: 600 }}>
              {t("common.done")}
            </button>
            <span style={{ fontSize: 16.5, fontWeight: 700 }}>
              {tabs.length} {t("safari.tabs")}
            </span>
            <button onClick={() => newTab(!tab.priv)} style={{ color: accent }}>
              <Plus size={22} strokeWidth={2.2} />
            </button>
          </div>
          <div style={{ display: "flex", gap: 9, marginBottom: 14 }}>
            <button
              onClick={() => newTab(false)}
              style={{ flex: 1, height: 42, borderRadius: 12, background: "rgba(120,120,128,0.2)", fontSize: 15, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}
            >
              <Plus size={16} strokeWidth={2.4} /> {t("safari.newTab")}
            </button>
            <button
              onClick={() => newTab(true)}
              style={{ flex: 1, height: 42, borderRadius: 12, background: "rgba(191,90,242,0.16)", color: "#bf5af2", fontSize: 15, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}
            >
              <LockIco size={15} strokeWidth={2.4} /> {t("safari.privateMode")}
            </button>
          </div>
          <div className="scroll-y" style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignContent: "start" }}>
            {tabs.map((x) => (
              <div
                key={x.id}
                onClick={() => {
                  setActiveId(x.id);
                  setSheet(null);
                  Sfx.tick();
                }}
                style={{
                  borderRadius: 14,
                  overflow: "hidden",
                  background: x.priv ? "#1d1526" : "var(--card)",
                  border: x.id === activeId ? `1.5px solid ${accent}` : "1.5px solid transparent",
                  cursor: "pointer",
                }}
              >
                <div style={{ height: 96, background: x.url && !x.priv ? "#fff" : x.priv ? "#120d18" : "rgba(120,120,128,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {x.priv ? (
                    <LockIco size={22} color="rgba(191,90,242,0.8)" strokeWidth={1.8} />
                  ) : x.url ? (
                    <span style={{ fontSize: 30, fontWeight: 800, color: "rgba(20,20,30,0.75)" }}>{titleOf(x.url)[0]}</span>
                  ) : (
                    <span style={{ fontSize: 12, opacity: 0.4 }}>{t("safari.newTab")}</span>
                  )}
                </div>
                <div style={{ padding: "8px 10px", display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {x.url ? x.title || hostOf(x.url) : t("safari.newTab")}
                    </div>
                    <div style={{ fontSize: 11.5, opacity: 0.45, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{x.url ? hostOf(x.url) : ""}</div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(x.id);
                    }}
                    style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(120,120,128,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                  >
                    <Xmark size={10} strokeWidth={2.6} color="rgba(170,170,180,1)" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Sheet>

      <Sheet open={sheet === "share"} onClose={() => setSheet(null)} height={420}>
        <div style={{ padding: "4px 18px 40px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Ellipsis size={18} strokeWidth={2.2} style={{ opacity: 0.6 }} />
            <span style={{ fontSize: 15.5, fontWeight: 600, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {tab.title || t("safari.share")}
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px 8px", marginBottom: 18 }}>
            {[t("common.share"), t("safari.bookmarks"), t("safari.reading"), t("common.open")].map((label, i) => (
              <button
                key={label}
                onClick={async () => {
                  Sfx.tick();
                  if (i === 1) {
                    toggleBookmark();
                    setSheet(null);
                  } else if (i === 2) {
                    setSheet(null);
                    void showAlert({ title: t("safari.reading"), message: t("common.done"), buttons: [t("common.ok")] });
                  } else if (i === 3 && tab.url) {
                    window.open(tab.url, "_blank", "noopener");
                  } else {
                    setSheet(null);
                  }
                }}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7 }}
              >
                <div className="glass" style={{ width: 54, height: 54, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {i === 0 ? <Share size={22} strokeWidth={2} /> : i === 1 ? <Bookmark size={22} strokeWidth={2} /> : i === 2 ? <Ellipsis size={22} strokeWidth={2.2} /> : <Plus size={22} strokeWidth={2.2} />}
                </div>
                <span style={{ fontSize: 11.5, opacity: 0.8 }}>{label}</span>
              </button>
            ))}
          </div>
          <div style={{ margin: "0 -2px", borderRadius: 12, background: "var(--card)", overflow: "hidden" }}>
            <button onClick={toggleBookmark} className="list-sep" style={{ width: "100%", padding: "13px 16px", textAlign: "left", fontSize: 16.5, color: isBookmarked ? "#ff453a" : "var(--blue)" }}>
              {isBookmarked ? t("common.delete") + " " + t("safari.bookmarks") : t("common.add") + " " + t("safari.bookmarks")}
            </button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
