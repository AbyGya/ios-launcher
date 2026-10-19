import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useT } from "../i18n";
import { useSettings } from "../store/settings";
import { useMedia } from "../store/media";
import { engine } from "../lib/music";
import { ALBUMS, TRACKS, type Track } from "../lib/tracks";
import { Sfx } from "../lib/sfx";
import { Haptics } from "../lib/haptics";
import { fmtTime } from "../lib/util";
import { TabBar, NavBar, PushView } from "../components/ui/surfaces";
import { Slider } from "../components/ui/controls";
import {
  Airplay,
  HeartIco,
  NextIco,
  Pause,
  Play,
  PrevIco,
  Repeat,
  Shuffle,
  VolumeHigh,
  Ellipsis,
  ListIco,
  MusicNoteIco,
  DiscIco,
  Mic,
} from "../icons/Sys";

function Art({ track, size, radius = 12 }: { track: Track; size: number; radius?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        position: "relative",
        overflow: "hidden",
        background: `linear-gradient(140deg, hsl(${track.hue},78%,60%), hsl(${track.hue2},72%,38%))`,
        flexShrink: 0,
        boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
      }}
    >
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 25% 20%, rgba(255,255,255,0.42), transparent 55%)" }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg viewBox="0 0 100 100" width={size * 0.46} height={size * 0.46} fill="rgba(255,255,255,0.92)">
          <path d="M38 26l34-8v10l-34 8z" />
          <rect x="66" y="18" width="6" height="42" rx="3" />
          <rect x="32" y="30" width="6" height="42" rx="3" />
          <ellipse cx="27" cy="74" rx="12" ry="9.6" />
          <ellipse cx="61" cy="62" rx="12" ry="9.6" />
        </svg>
      </div>
    </div>
  );
}

export function NowPlaying({ onClose }: { onClose: () => void }) {
  const lang = useSettings((s) => s.lang);
  const { currentId, playing, position, shuffle, repeat } = useMedia();
  const track = TRACKS.find((x) => x.id === currentId) ?? TRACKS[0];
  const [vol, setVol] = useState(useSettings.getState().volume);
  const [liked, setLiked] = useState(false);

  const progress = Math.min(1, position / track.duration);

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 300, damping: 32 }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0, bottom: 0.5 }}
      onDragEnd={(_, info) => {
        if (info.offset.y > 130) onClose();
      }}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 90,
        color: "#fff",
        background: `linear-gradient(180deg, hsl(${track.hue},58%,36%) 0%, #121216 55%, #0a0a0d 100%)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: 74,
      }}
    >
      <div style={{ width: 44, height: 5, borderRadius: 3, background: "rgba(255,255,255,0.35)", marginBottom: 20 }} />
      <motion.div
        animate={{ scale: playing ? [1, 1.035, 1] : 1 }}
        transition={{ repeat: playing ? Infinity : 0, duration: 3.4, ease: "easeInOut" }}
        style={{ boxShadow: `0 30px 80px -20px hsla(${track.hue},80%,50%,0.65)` }}
      >
        <Art track={track} size={310} radius={18} />
      </motion.div>

      <div style={{ width: "100%", padding: "0 34px", marginTop: 30 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 23, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{track.title}</div>
            <div style={{ fontSize: 19, opacity: 0.65, marginTop: 2 }}>{track.artist}</div>
          </div>
          <button
            onClick={() => {
              Haptics.light();
              setLiked(!liked);
            }}
            style={{ color: liked ? "#ff375f" : "rgba(255,255,255,0.7)" }}
          >
            <HeartIco size={26} />
          </button>
        </div>

        <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 6 }}>
          <div
            onClick={(e) => {
              const r = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
              engine.seek(((e.clientX - r.left) / r.width) * track.duration);
            }}
            style={{ height: 7, borderRadius: 4, background: "rgba(255,255,255,0.22)", cursor: "pointer", position: "relative" }}
          >
            <div style={{ position: "absolute", inset: "0 auto 0 0", width: `${progress * 100}%`, borderRadius: 4, background: "rgba(255,255,255,0.9)" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, opacity: 0.6, fontVariantNumeric: "tabular-nums" }}>
            <span>{fmtTime(position)}</span>
            <span>-{fmtTime(Math.max(0, track.duration - position))}</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14 }}>
          <button
            onClick={() => {
              Haptics.light();
              useMedia.getState().set({ shuffle: !shuffle });
            }}
            style={{ color: shuffle ? "#ff375f" : "rgba(255,255,255,0.75)" }}
          >
            <Shuffle size={24} />
          </button>
          <button onClick={() => engine.prev()} style={{ color: "#fff" }}>
            <PrevIco size={34} />
          </button>
          <button
            onClick={() => {
              Haptics.medium();
              Sfx.click();
              engine.toggle();
            }}
            style={{ width: 74, height: 74, borderRadius: "50%", background: "rgba(255,255,255,0.95)", color: "#111", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            {playing ? <Pause size={34} /> : <Play size={34} />}
          </button>
          <button onClick={() => engine.next()} style={{ color: "#fff" }}>
            <NextIco size={34} />
          </button>
          <button
            onClick={() => {
              Haptics.light();
              const next = repeat === "off" ? "all" : repeat === "all" ? "one" : "off";
              useMedia.getState().set({ repeat: next });
            }}
            style={{ color: repeat !== "off" ? "#ff375f" : "rgba(255,255,255,0.75)", position: "relative" }}
          >
            <Repeat size={24} />
            {repeat === "one" && <span style={{ position: "absolute", top: -8, right: -2, fontSize: 9, fontWeight: 800 }}>1</span>}
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 24 }}>
          <VolumeHigh size={18} style={{ opacity: 0.6 }} />
          <div style={{ flex: 1 }}>
            <Slider
              value={vol}
              thickness={10}
              length={280}
              onChange={(v) => {
                setVol(v);
                useSettings.getState().set({ volume: v });
              }}
              onEnd={() => void 0}
              icon={undefined}
            />
          </div>
          <button style={{ opacity: 0.6 }}>
            <Airplay size={20} />
          </button>
        </div>

        <div style={{ marginTop: 26, display: "flex", justifyContent: "space-between", borderTop: "0.5px solid rgba(255,255,255,0.14)", paddingTop: 16 }}>
          <span style={{ fontSize: 14, opacity: 0.65 }}>
            {lang === "id" ? "Berikutnya" : "Up Next"}: {TRACKS[(TRACKS.findIndex((x) => x.id === track.id) + 1) % TRACKS.length].title}
          </span>
          <button style={{ opacity: 0.65 }}>
            <ListIco size={22} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export function MiniPlayer({ onOpen }: { onOpen: () => void }) {
  const { currentId, playing, position } = useMedia();
  const track = TRACKS.find((x) => x.id === currentId);
  if (!track) return null;
  return (
    <motion.div
      layoutId="mini-player"
      onClick={onOpen}
      className="glass glass-strong"
      style={{
        position: "absolute",
        left: 12,
        right: 12,
        bottom: 86,
        height: 58,
        borderRadius: 16,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "0 10px",
        zIndex: 45,
        cursor: "pointer",
      }}
    >
      <Art track={track} size={42} radius={9} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{track.title}</div>
        <div style={{ fontSize: 12.5, opacity: 0.6 }}>{track.artist}</div>
      </div>
      <div style={{ position: "absolute", left: 10, right: 10, bottom: 2, height: 2, borderRadius: 2, background: "rgba(255,255,255,0.18)" }}>
        <div style={{ height: "100%", width: `${(position / track.duration) * 100}%`, background: "rgba(255,255,255,0.75)", borderRadius: 2 }} />
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          Haptics.medium();
          engine.toggle();
        }}
        style={{ padding: 6 }}
      >
        {playing ? <Pause size={22} /> : <Play size={22} />}
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          engine.next();
        }}
        style={{ padding: 6 }}
      >
        <NextIco size={22} />
      </button>
    </motion.div>
  );
}

export default function MusicApp() {
  const t = useT();
  const [tab, setTab] = useState(0);
  const [nowPlaying, setNowPlaying] = useState(false);
  const [albumOpen, setAlbumOpen] = useState<string | null>(null);
  const currentId = useMedia((s) => s.currentId);

  const playTrack = (id: string) => {
    Haptics.medium();
    Sfx.click();
    engine.play(id, 0);
    setNowPlaying(true);
  };

  const TrackRow = ({ track, i }: { track: Track; i: number }) => (
    <div
      onClick={() => playTrack(track.id)}
      style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 18px", cursor: "pointer" }}
    >
      <span style={{ width: 18, fontSize: 14, opacity: 0.4, fontVariantNumeric: "tabular-nums" }}>{i + 1}</span>
      <Art track={track} size={44} radius={8} />
      <div style={{ flex: 1, minWidth: 0, borderBottom: "0.5px solid rgba(120,120,128,0.22)", paddingBottom: 9, marginTop: 9 }}>
        <div style={{ fontSize: 16, fontWeight: 500, color: currentId === track.id ? "#ff375f" : undefined, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {track.title}
        </div>
        <div style={{ fontSize: 13.5, opacity: 0.55 }}>{track.artist}</div>
      </div>
      <Ellipsis size={18} style={{ opacity: 0.35 }} />
      <span style={{ fontSize: 13, opacity: 0.4, fontVariantNumeric: "tabular-nums" }}>{fmtTime(track.duration)}</span>
    </div>
  );

  const albumTracks = albumOpen ? TRACKS.filter((x) => x.album === albumOpen) : [];

  return (
    <div style={{ position: "absolute", inset: 0, background: "var(--app-bg)" }}>
      <NavBar
        title={tab === 0 ? t("music.library") : tab === 1 ? t("music.albums") : t("music.artists")}
        right={<span style={{ fontSize: 13, color: "var(--blue)", fontWeight: 600 }}>{t("music.play")}</span>}
      />
      <div className="scroll-y" id="app-scroll" style={{ position: "absolute", inset: 0, paddingTop: 158, paddingBottom: currentId ? 160 : 110 }}>
        {tab === 0 && (
          <div>
            <div style={{ padding: "0 18px 14px" }}>
              <button
                onClick={() => playTrack(TRACKS[Math.floor(Math.random() * TRACKS.length)].id)}
                className="glass glass-strong"
                style={{ width: "100%", borderRadius: 14, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, color: "#fff" }}
              >
                <Play size={22} />
                <span style={{ fontSize: 16, fontWeight: 600 }}>{t("music.shuffle")} — {t("music.play")} 🎧</span>
              </button>
            </div>
            {TRACKS.map((tr, i) => (
              <TrackRow key={tr.id} track={tr} i={i} />
            ))}
          </div>
        )}
        {tab === 1 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, padding: "6px 20px" }}>
            {ALBUMS.map((al) => {
              const tr = TRACKS.find((x) => x.album === al.name)!;
              return (
                <div key={al.name} onClick={() => setAlbumOpen(al.name)} style={{ cursor: "pointer" }}>
                  <div style={{ width: "100%", aspectRatio: "1", borderRadius: 12, background: `linear-gradient(140deg, hsl(${al.hue},78%,58%), hsl(${al.hue2},72%,38%))`, boxShadow: "0 10px 26px rgba(0,0,0,0.22)", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.35), transparent 55%)" }} />
                  </div>
                  <div style={{ fontSize: 14.5, fontWeight: 600, marginTop: 7 }}>{al.name}</div>
                  <div style={{ fontSize: 12.5, opacity: 0.55 }}>{tr.artist}</div>
                </div>
              );
            })}
          </div>
        )}
        {tab === 2 && (
          <div>
            {["Rasa Nusantara", "Kenangan", "Gema Pulau", "Neon Kota", "Laut Selatan"].map((artist) => (
              <div
                key={artist}
                onClick={() => {
                  const tr = TRACKS.find((x) => x.artist === artist);
                  if (tr) playTrack(tr.id);
                }}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 18px", cursor: "pointer" }}
              >
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: `linear-gradient(140deg, hsl(${(artist.length * 37) % 360},70%,60%), hsl(${(artist.length * 83) % 360},65%,40%))`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700 }}>
                  {artist[0]}
                </div>
                <div style={{ flex: 1, borderBottom: "0.5px solid rgba(120,120,128,0.22)", paddingBottom: 10, marginTop: 10 }}>
                  <div style={{ fontSize: 16, fontWeight: 500 }}>{artist}</div>
                  <div style={{ fontSize: 13, opacity: 0.55 }}>{TRACKS.filter((x) => x.artist === artist).length} {t("music.library")}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {currentId && !nowPlaying && <MiniPlayer onOpen={() => setNowPlaying(true)} />}

      <TabBar
        tabs={[
          { icon: <MusicNoteIco size={22} />, label: t("music.library") },
          { icon: <DiscIco size={22} />, label: t("music.albums") },
          { icon: <Mic size={22} />, label: t("music.artists") },
        ]}
        active={tab}
        onChange={setTab}
        tint="#ff375f"
      />

      <AnimatePresence>{nowPlaying && <NowPlaying onClose={() => setNowPlaying(false)} />}</AnimatePresence>

      <AnimatePresence>
        {albumOpen && (
          <PushView onClose={() => setAlbumOpen(null)} bg="var(--app-bg)">
            <div className="scroll-y" style={{ position: "absolute", inset: 0 }}>
              <div style={{ paddingTop: 100, paddingBottom: 30, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                <div style={{ width: 180, height: 180, borderRadius: 16, background: `linear-gradient(140deg, hsl(${TRACKS.find((x) => x.album === albumOpen)!.hue},78%,58%), hsl(${TRACKS.find((x) => x.album === albumOpen)!.hue2},72%,38%))`, boxShadow: "0 20px 50px rgba(0,0,0,0.3)" }} />
                <div style={{ fontSize: 22, fontWeight: 700 }}>{albumOpen}</div>
                <div style={{ fontSize: 14, opacity: 0.55 }}>{albumTracks[0]?.artist} · {albumTracks.length} {t("music.library")}</div>
                <button
                  onClick={() => playTrack(albumTracks[0].id)}
                  className="glass glass-strong"
                  style={{ borderRadius: 999, padding: "10px 28px", color: "#fff", fontSize: 15, fontWeight: 600, display: "flex", gap: 8, alignItems: "center" }}
                >
                  <Play size={17} /> {t("music.play")}
                </button>
              </div>
              {albumTracks.map((tr, i) => (
                <TrackRow key={tr.id} track={tr} i={i} />
              ))}
            </div>
            <button onClick={() => setAlbumOpen(null)} style={{ position: "absolute", top: 70, left: 16, color: "#ff375f", fontSize: 17, zIndex: 10 }}>
              ‹ {t("common.back")}
            </button>
          </PushView>
        )}
      </AnimatePresence>
    </div>
  );
}
