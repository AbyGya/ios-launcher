import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useT } from "../i18n";
import { useSettings } from "../store/settings";
import { usePhotos, type PhotoItem } from "../store/photos";
import { Haptics } from "../lib/haptics";
import { Sfx } from "../lib/sfx";
import { TabBar, NavBar, Sheet, showAlert } from "../components/ui/surfaces";
import { HeartIco, Share, Trash, Xmark, Play, PhotoIco, SparklesIco, FolderIco } from "../icons/Sys";

const fmtDate = (ts: number, lang: "id" | "en") =>
  new Intl.DateTimeFormat(lang === "id" ? "id-ID" : "en-US", { day: "numeric", month: "long", year: "numeric" }).format(ts);
const fmtTime = (ts: number, lang: "id" | "en") =>
  new Intl.DateTimeFormat(lang === "id" ? "id-ID" : "en-US", { hour: "2-digit", minute: "2-digit", hour12: false }).format(ts);

const PLACES = ["Jakarta", "Bandung", "Bali", "Yogyakarta", "Lombok", "Raja Ampat", "Bromo"];

function Viewer({ index, onClose, photos }: { index: number; onClose: () => void; photos: PhotoItem[] }) {
  const t = useT();
  const lang = useSettings((s) => s.lang);
  const [i, setI] = useState(index);
  const [info, setInfo] = useState(true);
  const photo = photos[i];
  const dragStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (i >= photos.length) setI(Math.max(0, photos.length - 1));
  }, [photos.length, i]);

  if (!photo) return null;

  const go = (dir: number) => {
    const next = i + dir;
    if (next < 0 || next >= photos.length) return;
    Haptics.light();
    Sfx.tick();
    setI(next);
  };

  const del = async () => {
    const r = await showAlert({
      title: lang === "id" ? "Hapus foto ini?" : "Delete this photo?",
      message: lang === "id" ? "Foto akan dihapus dari semua perangkatmu." : "This photo will be deleted from all your devices.",
      buttons: [lang === "id" ? "Hapus Foto" : "Delete Photo", t("common.cancel")],
      cancelIndex: 1,
    });
    if (r === 0) {
      Haptics.heavy();
      Sfx.error();
      usePhotos.getState().remove(photo.id);
      if (photos.length <= 1) onClose();
      else setI(Math.min(i, photos.length - 2));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: "absolute", inset: 0, zIndex: 95, background: "#000", color: "#fff", overflow: "hidden" }}
    >
      <div
        onPointerDown={(e) => (dragStart.current = { x: e.clientX, y: e.clientY })}
        onPointerUp={(e) => {
          if (!dragStart.current) return;
          const dx = e.clientX - dragStart.current.x;
          const dy = e.clientY - dragStart.current.y;
          dragStart.current = null;
          if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
          else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) onClose();
          else if (Math.abs(dx) < 6 && Math.abs(dy) < 6) setInfo(!info);
        }}
        style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", touchAction: "pan-y" }}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.img
            key={photo.id}
            src={photo.url}
            initial={{ opacity: 0.4, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
            draggable={false}
          />
        </AnimatePresence>
        {photo.kind === "video" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
            <div style={{ width: 68, height: 68, borderRadius: "50%", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Play size={30} />
            </div>
            <div style={{ position: "absolute", bottom: 130, fontSize: 13, opacity: 0.8 }}>0:12</div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {info && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, paddingTop: 66, paddingBottom: 14, background: "linear-gradient(rgba(0,0,0,0.65), transparent)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "66px 18px 14px" }}>
              <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.14)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Xmark size={17} />
              </button>
              <span style={{ fontSize: 15, opacity: 0.8 }}>{i + 1} / {photos.length}</span>
              <button
                onClick={() => {
                  Haptics.light();
                  Sfx.tick();
                  usePhotos.getState().toggleFavorite(photo.id);
                }}
                style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.14)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", color: photo.favorite ? "#ff375f" : "#fff" }}
              >
                <HeartIco size={18} />
              </button>
            </div>
            <div style={{ position: "absolute", bottom: 44, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
              <div style={{ display: "flex", gap: 12, background: "rgba(30,30,34,0.75)", backdropFilter: "blur(20px)", borderRadius: 16, padding: "10px 20px", alignItems: "center" }}>
                <div style={{ textAlign: "center", marginRight: 8 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{fmtDate(photo.ts, lang)}</div>
                  <div style={{ fontSize: 12, opacity: 0.6 }}>{fmtTime(photo.ts, lang)} · {PLACES[photo.ts % PLACES.length]}</div>
                </div>
                <button onClick={() => showAlert({ title: lang === "id" ? "Bagikan Foto" : "Share Photo", message: lang === "id" ? "Salin tautan dibagikan ke papan klip." : "A share link copied to clipboard.", buttons: ["OK"] })} style={{ color: "#0a84ff" }}>
                  <Share size={21} />
                </button>
                <button onClick={del} style={{ color: "#ff453a" }}>
                  <Trash size={21} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function PhotosApp() {
  const t = useT();
  const lang = useSettings((s) => s.lang);
  const photos = usePhotos((s) => s.photos);
  const loaded = usePhotos((s) => s.loaded);
  const [tab, setTab] = useState(0);
  const [seg, setSeg] = useState(0);
  const [viewer, setViewer] = useState<number | null>(null);
  const [albumsOpen, setAlbumsOpen] = useState(false);

  useEffect(() => {
    void usePhotos.getState().load();
  }, []);

  const filtered = seg === 0 ? photos : seg === 1 ? photos.filter((p) => p.favorite) : photos.filter((p) => p.kind === "video");

  const thumbs = (list: PhotoItem[], onTap: (p: PhotoItem) => void, size = 3) => (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${size}, 1fr)`, gap: 2, padding: 2 }}>
      {list.map((p) => (
        <button
          key={p.id}
          onClick={() => onTap(p)}
          style={{ aspectRatio: "1", overflow: "hidden", position: "relative", background: "#111" }}
        >
          <img src={p.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
          {p.kind === "video" && (
            <span style={{ position: "absolute", bottom: 5, left: 7, fontSize: 10, textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>▶ 0:12</span>
          )}
          {p.favorite && <span style={{ position: "absolute", bottom: 4, right: 6, color: "#ff375f", fontSize: 12 }}>♥</span>}
        </button>
      ))}
    </div>
  );

  return (
    <div style={{ position: "absolute", inset: 0, background: "var(--app-bg)" }}>
      <NavBar title={tab === 0 ? (lang === "id" ? "Koleksi" : "Library") : tab === 1 ? t("app.photos") : (lang === "id" ? "Album" : "Albums")} />

      {tab === 0 && (
        <div className="scroll-y" id="app-scroll" style={{ position: "absolute", inset: 0, paddingTop: 160, paddingBottom: 110 }}>
          <div style={{ display: "flex", gap: 8, padding: "0 14px 12px" }}>
            {[lang === "id" ? "Semua" : "All", t("photos.favorites"), "Video"].map((label, i2) => (
              <button
                key={label}
                onClick={() => {
                  Haptics.selection();
                  setSeg(i2);
                }}
                style={{ padding: "7px 15px", borderRadius: 999, fontSize: 14, fontWeight: 600, background: seg === i2 ? "var(--blue)" : "rgba(120,120,128,0.18)", color: seg === i2 ? "#fff" : "inherit" }}
              >
                {label}
              </button>
            ))}
          </div>
          {!loaded && <div style={{ textAlign: "center", opacity: 0.5, padding: 40, fontSize: 14 }}>…</div>}
          {thumbs(filtered, (p) => setViewer(filtered.indexOf(p)))}
          <div style={{ height: 40 }} />
        </div>
      )}

      {tab === 1 && (
        <div className="scroll-y" id="app-scroll" style={{ position: "absolute", inset: 0, paddingTop: 158, paddingBottom: 110 }}>
          {[
            { title: lang === "id" ? "Liburan Bali" : "Bali Getaway", sub: lang === "id" ? "28 foto · Musik: Senja di Jakarta" : "28 photos · Soundtrack: Senja di Jakarta", span: photos.slice(2, 10) },
            { title: lang === "id" ? "Akhir Pekan" : "Weekend", sub: lang === "id" ? "12 foto" : "12 photos", span: photos.slice(10, 16) },
            { title: lang === "id" ? "Makanan Favorit" : "Food Favorites", sub: lang === "id" ? "8 foto" : "8 photos", span: photos.slice(16, 22) },
          ].map((m, mi) => (
            <div key={m.title} style={{ margin: "0 16px 18px", borderRadius: 18, overflow: "hidden", position: "relative", height: 210, background: "#111", cursor: "pointer" }} onClick={() => setViewer(mi === 0 ? 2 : mi === 1 ? 10 : 16)}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2, height: "100%" }}>
                {m.span.slice(0, 4).map((p) => (
                  <img key={p.id} src={p.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }} />
                ))}
              </div>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(transparent 30%, rgba(0,0,0,0.75))", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: 16, color: "#fff" }}>
                <div style={{ fontSize: 19, fontWeight: 700 }}>{m.title}</div>
                <div style={{ fontSize: 12.5, opacity: 0.75, marginTop: 2 }}>{m.sub}</div>
              </div>
              <div style={{ position: "absolute", top: 12, left: 14, display: "flex", alignItems: "center", gap: 6, color: "#fff", fontSize: 12, fontWeight: 600 }}>
                <Play size={13} /> {lang === "id" ? "Ingatkan" : "Memory"}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 2 && (
        <div className="scroll-y" id="app-scroll" style={{ position: "absolute", inset: 0, paddingTop: 158, paddingBottom: 110 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, padding: "0 18px" }}>
            {[
              { name: lang === "id" ? "Baru Saja" : "Recents", list: photos.slice(0, 12) },
              { name: t("photos.favorites"), list: photos.filter((p) => p.favorite) },
              { name: "Video", list: photos.filter((p) => p.kind === "video") },
              { name: lang === "id" ? "Layar Kunci" : "Lock Screen", list: photos.slice(6, 14) },
            ].map((al) => (
              <div key={al.name} style={{ cursor: "pointer" }} onClick={() => setAlbumsOpen(true)}>
                <div style={{ aspectRatio: "1", borderRadius: 12, overflow: "hidden", background: "var(--card)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {al.list[0] ? <img src={al.list[0].url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ opacity: 0.4 }}>—</span>}
                </div>
                <div style={{ fontSize: 14.5, fontWeight: 600, marginTop: 7 }}>{al.name}</div>
                <div style={{ fontSize: 12.5, opacity: 0.55 }}>{al.list.length}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <TabBar
        tabs={[
          { icon: <PhotoIco size={22} />, label: lang === "id" ? "Koleksi" : "Library" },
          { icon: <SparklesIco size={22} />, label: lang === "id" ? "Untukmu" : "For You" },
          { icon: <FolderIco size={22} />, label: lang === "id" ? "Album" : "Albums" },
        ]}
        active={tab}
        onChange={setTab}
      />

      <Sheet open={albumsOpen} onClose={() => setAlbumsOpen(false)}>
        <div style={{ padding: "4px 20px 40px" }}>
          <div style={{ textAlign: "center", fontSize: 17, fontWeight: 700, marginBottom: 10 }}>{lang === "id" ? "Semua Album" : "All Albums"}</div>
          {[lang === "id" ? "Baru Saja" : "Recents", t("photos.favorites"), "Video", "Wallpaper", lang === "id" ? "Tangkapan Layar" : "Screenshots"].map((n) => (
            <div key={n} style={{ padding: "12px 0", fontSize: 16.5, borderBottom: "0.5px solid rgba(120,120,128,0.24)" }} onClick={() => setAlbumsOpen(false)}>
              {n}
            </div>
          ))}
        </div>
      </Sheet>

      <AnimatePresence>
        {viewer !== null && (
          <Viewer index={Math.min(viewer, Math.max(0, filtered.length - 1))} photos={filtered} onClose={() => setViewer(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
