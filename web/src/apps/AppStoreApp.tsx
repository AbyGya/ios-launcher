import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useT } from "../i18n";
import { useLocalState } from "../lib/useLocalState";
import { Sfx } from "../lib/sfx";
import { Haptics } from "../lib/haptics";
import { SearchBar, Segmented } from "../components/ui/controls";
import { NavBar, PushView, TabBar, showAlert } from "../components/ui/surfaces";
import { GridIco, ListIco, Magnifier, SparklesIco, Star } from "../icons/Sys";

interface StoreApp {
  id: string;
  name: string;
  tagline: string;
  kind: "game" | "app";
  hue: number;
  rating: number;
  size: string;
}

const CATALOG: StoreApp[] = [
  { id: "a1", name: "Sate Run", tagline: "Lari sambil kumpulkan sate", kind: "game", hue: 24, rating: 4.8, size: "184 MB" },
  { id: "a2", name: "Nusa Photos", tagline: "Editor foto bergaya Nusantara", kind: "app", hue: 210, rating: 4.7, size: "96 MB" },
  { id: "a3", name: "WarungKu", tagline: "Kelola warung dari HP", kind: "app", hue: 140, rating: 4.6, size: "58 MB" },
  { id: "a4", name: "Ojek Now", tagline: "Transportasi cepat & murah", kind: "app", hue: 45, rating: 4.5, size: "142 MB" },
  { id: "a5", name: "Batik Puzzle", tagline: "Susun motif batik", kind: "game", hue: 350, rating: 4.9, size: "210 MB" },
  { id: "a6", name: "Raja Katak", tagline: "Petualangan katak pemberani", kind: "game", hue: 120, rating: 4.4, size: "320 MB" },
  { id: "a7", name: "Cuaca Pro", tagline: "Radar hujan akurat", kind: "app", hue: 200, rating: 4.6, size: "72 MB" },
  { id: "a8", name: "Dompet Digital", tagline: "Bayar apa saja", kind: "app", hue: 280, rating: 4.7, size: "128 MB" },
  { id: "a9", name: "Buku Cerita", tagline: "Ribuan cerita anak", kind: "app", hue: 320, rating: 4.8, size: "64 MB" },
  { id: "a10", name: "Kopi Timer", tagline: "Seduh kopi sempurna", kind: "app", hue: 30, rating: 4.3, size: "44 MB" },
  { id: "a11", name: "Lagu Nusantara", tagline: "Streaming lagu daerah", kind: "app", hue: 160, rating: 4.5, size: "88 MB" },
  { id: "a12", name: "Catur Legenda", tagline: "Catur klasik offline", kind: "game", hue: 250, rating: 4.6, size: "156 MB" },
];

const HERO = CATALOG[4];

function AppIcon({ app, size = 60 }: { app: StoreApp; size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.23,
        background: `linear-gradient(160deg, hsl(${app.hue},70%,58%), hsl(${app.hue + 24},75%,38%))`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.3,
        fontWeight: 800,
        color: "#fff",
        flexShrink: 0,
      }}
    >
      {app.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
    </div>
  );
}

function GetButton({ installed, onGet, onOpen }: { installed: boolean; onGet: () => void; onOpen: () => void }) {
  const t = useT();
  return (
    <button
      onClick={installed ? onOpen : onGet}
      style={{
        minWidth: 74,
        height: 32,
        borderRadius: 16,
        background: installed ? "rgba(120,120,128,0.22)" : "var(--blue)",
        color: installed ? "var(--blue)" : "#fff",
        fontSize: 14.5,
        fontWeight: 700,
        padding: "0 16px",
        flexShrink: 0,
      }}
    >
      {installed ? t("appstore.openApp") : t("appstore.get")}
    </button>
  );
}

export default function AppStoreApp() {
  const t = useT();
  const [tab, setTab] = useState(0);
  const [query, setQuery] = useState("");
  const [seg, setSeg] = useState(0);
  const [push, setPush] = useState<StoreApp | null>(null);
  const [installed, setInstalled] = useLocalState<string[]>("asInstalled", []);

  const list = useMemo(() => (tab === 1 ? CATALOG.filter((a) => a.kind === "game") : tab === 2 ? CATALOG.filter((a) => a.kind === "app") : []), [tab]);
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CATALOG;
    return CATALOG.filter((a) => a.name.toLowerCase().includes(q) || a.tagline.toLowerCase().includes(q));
  }, [query]);

  const get = (app: StoreApp) => {
    if (installed.includes(app.id)) return;
    Haptics.success();
    Sfx.ding();
    setInstalled((prev) => [...prev, app.id]);
  };

  const openApp = (app: StoreApp) => {
    Sfx.click();
    void showAlert({ title: t("appstore.openApp"), message: app.name, buttons: [t("common.ok")] });
  };

  const Row = ({ app }: { app: StoreApp }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px" }}>
      <button onClick={() => { setPush(app); Sfx.tick(); }}>
        <AppIcon app={app} size={58} />
      </button>
      <button onClick={() => { setPush(app); Sfx.tick(); }} style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
        <div style={{ fontSize: 16, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{app.name}</div>
        <div style={{ fontSize: 13.5, opacity: 0.55, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{app.tagline}</div>
        <div style={{ fontSize: 12.5, opacity: 0.45, display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
          <Star size={11} strokeWidth={0} style={{ fill: "rgba(150,150,160,0.9)" }} /> {app.rating.toFixed(1).replace(".", ",")} · {app.size}
        </div>
      </button>
      <GetButton installed={installed.includes(app.id)} onGet={() => get(app)} onOpen={() => openApp(app)} />
    </div>
  );

  return (
    <div style={{ position: "absolute", inset: 0, background: "var(--app-bg)" }}>
      <div className="scroll-y" id="app-scroll" style={{ position: "absolute", inset: 0, paddingTop: 0, paddingBottom: 130 }}>
        <NavBar title={tab === 0 ? t("appstore.today") : tab === 1 ? t("appstore.games") : tab === 2 ? t("appstore.apps") : t("appstore.search")} />

        {tab === 0 && (
          <>
            <button
              onClick={() => {
                setPush(HERO);
                Sfx.tick();
              }}
              style={{ display: "block", width: "calc(100% - 32px)", margin: "4px 16px 0", borderRadius: 20, overflow: "hidden", textAlign: "left", position: "relative", height: 400 }}
            >
              <div style={{ position: "absolute", inset: 0, background: `linear-gradient(165deg, hsl(${HERO.hue},70%,54%), hsl(${HERO.hue - 30},80%,26%))` }} />
              <div style={{ position: "absolute", inset: 0, padding: "22px 22px 20px", display: "flex", flexDirection: "column", justifyContent: "space-between", color: "#fff" }}>
                <div style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", opacity: 0.9 }}>{t("appstore.featured")}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.85, marginBottom: 6 }}>🔥 {t("appstore.today").toUpperCase()}</div>
                  <div style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.15 }}>{HERO.name}</div>
                  <div style={{ fontSize: 16, opacity: 0.85, marginTop: 6 }}>{HERO.tagline}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <AppIcon app={HERO} size={52} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{HERO.name}</div>
                    <div style={{ fontSize: 12.5, opacity: 0.8 }}>
                      {t("appstore.games")} · {HERO.size}
                    </div>
                  </div>
                  <GetButton installed={installed.includes(HERO.id)} onGet={() => get(HERO)} onOpen={() => openApp(HERO)} />
                </div>
              </div>
            </button>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 18px 10px" }}>
              <span style={{ fontSize: 21, fontWeight: 700 }}>{t("appstore.tryNow")}</span>
              <button onClick={() => { setTab(2); Sfx.tick(); }} style={{ fontSize: 15, color: "var(--blue)", fontWeight: 600 }}>
                {t("appstore.seeAll")}
              </button>
            </div>
            <div style={{ padding: "0 16px" }}>
              <div style={{ borderRadius: 16, background: "var(--card)", overflow: "hidden" }}>
                {CATALOG.slice(0, 3).map((a, i) => (
                  <div key={a.id} className={i > 0 ? "list-sep" : undefined}>
                    <Row app={a} />
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 18px 10px" }}>
              <span style={{ fontSize: 21, fontWeight: 700 }}>{t("appstore.next")}</span>
            </div>
            <div style={{ display: "flex", gap: 14, padding: "0 16px 10px", overflowX: "auto", scrollbarWidth: "none" }}>
              {CATALOG.slice(6, 10).map((a) => (
                <button
                  key={a.id}
                  onClick={() => {
                    setPush(a);
                    Sfx.tick();
                  }}
                  style={{
                    width: 220,
                    flexShrink: 0,
                    borderRadius: 16,
                    background: "var(--card)",
                    padding: 16,
                    textAlign: "left",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <AppIcon app={a} size={52} />
                  <div>
                    <div style={{ fontSize: 15.5, fontWeight: 700 }}>{a.name}</div>
                    <div style={{ fontSize: 13, opacity: 0.55, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.tagline}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <GetButton installed={installed.includes(a.id)} onGet={() => get(a)} onOpen={() => openApp(a)} />
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {tab === 3 && (
          <>
            <div style={{ padding: "4px 16px 12px" }}>
              <SearchBar value={query} onChange={setQuery} placeholder={t("appstore.search")} />
            </div>
            <div style={{ display: "flex", gap: 10, padding: "0 16px 12px" }}>
              <Segmented options={[t("appstore.apps"), t("appstore.games")]} value={seg} onChange={setSeg} />
            </div>
            {results.filter((a) => (seg === 0 ? a.kind === "app" : a.kind === "game")).length === 0 ? (
              <div style={{ padding: "60px 40px", textAlign: "center" }}>
                <Magnifier size={34} strokeWidth={1.8} style={{ opacity: 0.35 }} />
                <div style={{ fontSize: 16, opacity: 0.5, marginTop: 12 }}>{t("appstore.search")}</div>
              </div>
            ) : (
              <div style={{ margin: "0 16px", borderRadius: 16, background: "var(--card)", overflow: "hidden" }}>
                {results
                  .filter((a) => (seg === 0 ? a.kind === "app" : a.kind === "game"))
                  .map((a, i) => (
                    <div key={a.id} className={i > 0 ? "list-sep" : undefined}>
                      <Row app={a} />
                    </div>
                  ))}
              </div>
            )}
          </>
        )}

        {(tab === 1 || tab === 2) && (
          <div style={{ margin: "4px 16px 0", borderRadius: 16, background: "var(--card)", overflow: "hidden" }}>
            {list.map((a, i) => (
              <div key={a.id} className={i > 0 ? "list-sep" : undefined}>
                <Row app={a} />
              </div>
            ))}
          </div>
        )}
      </div>

      <TabBar
        tabs={[
          { icon: <SparklesIco size={22} strokeWidth={2} />, label: t("appstore.today") },
          { icon: <GridIco size={22} strokeWidth={2} />, label: t("appstore.games") },
          { icon: <ListIco size={22} strokeWidth={2} />, label: t("appstore.apps") },
          { icon: <Magnifier size={22} strokeWidth={2} />, label: t("appstore.search") },
        ]}
        active={tab}
        onChange={setTab}
      />

      <AnimatePresence>
        {push && (
          <PushView onClose={() => setPush(null)}>
            <NavBar title={t("appstore.apps")} large={false} onBack={() => setPush(null)} right={<GetButton installed={installed.includes(push.id)} onGet={() => get(push)} onOpen={() => openApp(push)} />} />
            <div className="scroll-y" style={{ position: "absolute", inset: 0, paddingTop: 116, paddingBottom: 60 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "6px 18px 0" }}>
                <AppIcon app={push} size={92} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 21, fontWeight: 800 }}>{push.name}</div>
                  <div style={{ fontSize: 14.5, opacity: 0.55 }}>{push.tagline}</div>
                  <div style={{ fontSize: 13, opacity: 0.45, marginTop: 4 }}>
                    {push.kind === "game" ? t("appstore.games") : t("appstore.apps")} · {push.size}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", margin: "20px 18px 0", borderTop: "1px solid rgba(120,120,128,0.2)", borderBottom: "1px solid rgba(120,120,128,0.2)" }}>
                {[
                  { top: push.rating.toFixed(1).replace(".", ","), bottom: t("appstore.reviews") },
                  { top: push.size.replace(" MB", ""), bottom: "MB" },
                  { top: "#1", bottom: push.kind === "game" ? t("appstore.games") : t("appstore.apps") },
                  { top: "4+", bottom: t("appstore.years") },
                ].map((cell, i) => (
                  <div key={i} style={{ flex: 1, textAlign: "center", padding: "10px 0", borderLeft: i > 0 ? "1px solid rgba(120,120,128,0.2)" : undefined }}>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{cell.top}</div>
                    <div style={{ fontSize: 10.5, opacity: 0.45, textTransform: "uppercase", letterSpacing: 0.4 }}>{cell.bottom}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 12, padding: "18px 18px 0", overflowX: "auto", scrollbarWidth: "none" }}>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: 170,
                      height: 300,
                      flexShrink: 0,
                      borderRadius: 18,
                      background: `linear-gradient(${160 + i * 40}deg, hsl(${push.hue + i * 22},62%,52%), hsl(${push.hue - 10 - i * 16},72%,28%))`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 52,
                      fontWeight: 800,
                      color: "rgba(255,255,255,0.85)",
                    }}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>

              <div style={{ padding: "22px 18px 8px", fontSize: 19, fontWeight: 700 }}>{t("appstore.about")}</div>
              <div style={{ padding: "0 18px", fontSize: 15, lineHeight: 1.5, opacity: 0.75 }}>
                {push.name} — {push.tagline}. {push.kind === "game" ? t("appstore.games") : t("appstore.apps")} #1 {t("common.today")}.
              </div>
            </div>
          </PushView>
        )}
      </AnimatePresence>
    </div>
  );
}
