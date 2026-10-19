import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useT } from "../i18n";
import { useSettings } from "../store/settings";
import { useSystem } from "../store/system";
import { usePhotos } from "../store/photos";
import { useIsland } from "../store/island";
import { Sfx } from "../lib/sfx";
import { Haptics } from "../lib/haptics";
import { fmtTime } from "../lib/util";
import { CameraGlyph, Flashlight, Rotate, Xmark, GridIco } from "../icons/Sys";

type Mode = "photo" | "video" | "portrait";
type Facing = "environment" | "user";
type FilterId = "none" | "vivid" | "mono" | "warm" | "cool";

const FILTERS: { id: FilterId; label: string; css: string }[] = [
  { id: "none", label: "Original", css: "none" },
  { id: "vivid", label: "Vivid", css: "saturate(1.6) contrast(1.12)" },
  { id: "mono", label: "Mono", css: "grayscale(1) contrast(1.08)" },
  { id: "warm", label: "Warm", css: "sepia(0.35) saturate(1.3)" },
  { id: "cool", label: "Cool", css: "hue-rotate(18deg) saturate(1.2)" },
];

export default function CameraApp() {
  const t = useT();
  const lang = useSettings((s) => s.lang);
  const photosCount = usePhotos((s) => s.photos.length);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [mode, setMode] = useState<Mode>("photo");
  const [facing, setFacing] = useState<Facing>("environment");
  const [filter, setFilter] = useState<FilterId>("none");
  const [zoom, setZoom] = useState(1);
  const [flash, setFlash] = useState(false);
  const [grid, setGrid] = useState(false);
  const [mirror, setMirror] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recSecs, setRecSecs] = useState(0);
  const [flashAnim, setFlashAnim] = useState(false);
  const [pickFilter, setPickFilter] = useState(false);
  const recActivity = useRef<string | null>(null);
  const recTimer = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const start = async () => {
      setReady(false);
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("unsupported");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: mode === "video",
        });
        if (cancelled) {
          stream.getTracks().forEach((tr) => tr.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => void 0);
        }
        setError(null);
        setReady(true);
      } catch {
        if (!cancelled) setError("denied");
      }
    };
    if (useSystem.getState().currentApp === "camera") void start();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
      streamRef.current = null;
    };
  }, [facing, mode]);

  useEffect(() => {
    if (!recording) {
      if (recTimer.current) window.clearInterval(recTimer.current);
      return;
    }
    recTimer.current = window.setInterval(() => setRecSecs((s) => s + 1), 1000);
    return () => {
      if (recTimer.current) window.clearInterval(recTimer.current);
    };
  }, [recording]);

  useEffect(() => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (track) {
      track.applyConstraints({ advanced: [{ zoom } as MediaTrackConstraintSet] }).catch(() => void 0);
    }
  }, [zoom]);

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: !flash } as MediaTrackConstraintSet] });
      setFlash(!flash);
      Haptics.light();
      Sfx.tick();
    } catch {
      Sfx.error();
    }
  };

  const drawFrame = (): string | null => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return null;
    const c = document.createElement("canvas");
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    const ctx = c.getContext("2d")!;
    const css = FILTERS.find((f) => f.id === filter)!.css;
    if (css !== "none") ctx.filter = css;
    if (mirror && facing === "user") {
      ctx.translate(c.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(v, 0, 0);
    return c.toDataURL("image/jpeg", 0.9);
  };

  const synthShot = (): string => {
    const c = document.createElement("canvas");
    c.width = 1170;
    c.height = 2532;
    const ctx = c.getContext("2d")!;
    const hue = (Date.now() / 60) % 360;
    const g = ctx.createLinearGradient(0, 0, c.width, c.height);
    g.addColorStop(0, `hsl(${hue}, 70%, 55%)`);
    g.addColorStop(0.5, `hsl(${(hue + 60) % 360}, 65%, 35%)`);
    g.addColorStop(1, `hsl(${(hue + 140) % 360}, 60%, 20%)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, c.width, c.height);
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = `hsla(${(hue + i * 9) % 360}, 80%, 70%, ${0.04 + Math.random() * 0.12})`;
      ctx.beginPath();
      ctx.arc(Math.random() * c.width, Math.random() * c.height, 40 + Math.random() * 240, 0, Math.PI * 2);
      ctx.fill();
    }
    return c.toDataURL("image/jpeg", 0.88);
  };

  const capture = () => {
    Haptics.medium();
    Sfx.shutter();
    setFlashAnim(true);
    window.setTimeout(() => setFlashAnim(false), 260);
    const url = error ? synthShot() : drawFrame();
    if (!url) {
      usePhotos.getState().add(synthShot());
      return;
    }
    usePhotos.getState().add(url);
  };

  const startRecording = () => {
    const stream = streamRef.current;
    if (!stream) {
      capture();
      return;
    }
    try {
      const rec = new MediaRecorder(stream, MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? { mimeType: "video/webm;codecs=vp9" } : undefined);
      chunksRef.current = [];
      rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      rec.onstop = () => {
        const frame = drawFrame();
        usePhotos.getState().add(frame ?? synthShot(), "video");
        Haptics.heavy();
        Sfx.timerDone();
      };
      rec.start(250);
      recorderRef.current = rec;
      setRecording(true);
      setRecSecs(0);
      Haptics.heavy();
      Sfx.tick();
      recActivity.current = useIsland.getState().add({ kind: "recording", startedAt: Date.now(), cameraOn: true, title: lang === "id" ? "Kamera aktif" : "Camera active" });
    } catch {
      capture();
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setRecording(false);
    if (recActivity.current) {
      useIsland.getState().remove(recActivity.current);
      recActivity.current = null;
    }
  };

  const filtered = FILTERS.find((f) => f.id === filter)!.css;

  return (
    <div style={{ position: "absolute", inset: 0, background: "#000", color: "#fff", overflow: "hidden" }}>
      {!error && (
        <video
          ref={videoRef}
          playsInline
          muted
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: filtered === "none" ? undefined : filtered,
            transform: `scale(${zoom}) ${mirror && facing === "user" ? "scaleX(-1)" : ""}`,
            transition: "transform 0.25s ease",
          }}
        />
      )}

      {error && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, background: "linear-gradient(160deg,#1c1c22,#0a0a0c)" }}>
          <CameraGlyph size={54} color="rgba(255,255,255,0.5)" />
          <div style={{ fontSize: 17, fontWeight: 600 }}>{error === "denied" ? t("camera.permission") : t("camera.unsupported")}</div>
          <div style={{ fontSize: 13.5, opacity: 0.55, maxWidth: 260, textAlign: "center", lineHeight: 1.45 }}>
            {lang === "id" ? "Mode demo akan menghasilkan foto artistik yang di-generate secara sintetis." : "Demo mode will capture synthetically generated artistic photos."}
          </div>
          <button
            onClick={capture}
            style={{ marginTop: 8, padding: "11px 22px", borderRadius: 999, background: "#ffd60a", color: "#111", fontSize: 15, fontWeight: 700 }}
          >
            {lang === "id" ? "Ambil Foto Demo" : "Take Demo Photo"}
          </button>
        </div>
      )}

      {grid && (
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.35 }}>
          <div style={{ position: "absolute", left: "33.33%", top: 0, bottom: 0, width: 1, background: "#fff" }} />
          <div style={{ position: "absolute", left: "66.66%", top: 0, bottom: 0, width: 1, background: "#fff" }} />
          <div style={{ position: "absolute", top: "33.33%", left: 0, right: 0, height: 1, background: "#fff" }} />
          <div style={{ position: "absolute", top: "66.66%", left: 0, right: 0, height: 1, background: "#fff" }} />
        </div>
      )}

      <AnimatePresence>
        {flashAnim && <motion.div initial={{ opacity: 0.95 }} animate={{ opacity: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} style={{ position: "absolute", inset: 0, background: "#fff", zIndex: 60 }} />}
      </AnimatePresence>

      <div style={{ position: "absolute", top: 74, left: 0, right: 0, display: "flex", justifyContent: "space-between", padding: "0 22px", zIndex: 20 }}>
        <button onClick={toggleTorch} style={{ width: 40, height: 40, borderRadius: "50%", background: flash ? "#ffd60a" : "rgba(0,0,0,0.4)", backdropFilter: "blur(14px)", display: "flex", alignItems: "center", justifyContent: "center", color: flash ? "#111" : "#fff" }}>
          <Flashlight size={19} />
        </button>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setGrid(!grid)} style={{ width: 40, height: 40, borderRadius: "50%", background: grid ? "#ffd60a" : "rgba(0,0,0,0.4)", backdropFilter: "blur(14px)", display: "flex", alignItems: "center", justifyContent: "center", color: grid ? "#111" : "#fff" }}>
            <GridIco size={19} />
          </button>
          <button
            onClick={() => {
              setFacing((f) => (f === "environment" ? "user" : "environment"));
              Haptics.medium();
              Sfx.click();
            }}
            style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(0,0,0,0.4)", backdropFilter: "blur(14px)", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <Rotate size={19} />
          </button>
        </div>
      </div>

      {recording && (
        <div style={{ position: "absolute", top: 128, left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(14px)", padding: "6px 14px", borderRadius: 999, fontSize: 14, fontVariantNumeric: "tabular-nums" }}>
            <span style={{ width: 9, height: 9, borderRadius: 9, background: "#ff453a", animation: "blink 1s infinite" }} />
            {fmtTime(recSecs)}
            {mode === "video" && <span style={{ opacity: 0.6 }}>· 4K 60</span>}
          </div>
        </div>
      )}

      <div style={{ position: "absolute", bottom: 128, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 6, zIndex: 20 }}>
        {[1, 2, 3].map((z) => (
          <button
            key={z}
            onClick={() => {
              setZoom(z);
              Haptics.selection();
              Sfx.tick();
            }}
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: zoom === z ? "rgba(255,214,10,0.95)" : "rgba(0,0,0,0.45)",
              color: zoom === z ? "#111" : "#fff",
              fontSize: 13,
              fontWeight: 700,
              backdropFilter: "blur(14px)",
            }}
          >
            {z}x
          </button>
        ))}
      </div>

      <div style={{ position: "absolute", bottom: 42, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center", zIndex: 20 }}>
        <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 30px" }}>
          <button
            onClick={() => useSystem.getState().launchApp("photos")}
            style={{ width: 52, height: 52, borderRadius: 12, overflow: "hidden", border: "1.5px solid rgba(255,255,255,0.4)", position: "relative", background: "#222" }}
          >
            {photosCount > 0 && (
              <img src={usePhotos.getState().photos[0].url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            )}
          </button>

          <button
            onClick={recording ? stopRecording : mode === "video" ? startRecording : capture}
            style={{ width: 78, height: 78, borderRadius: "50%", border: "4px solid #fff", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", padding: 5 }}
          >
            <span
              style={{
                width: "100%",
                height: "100%",
                borderRadius: recording ? 10 : "50%",
                background: mode === "video" || recording ? "#ff453a" : "#fff",
                transition: "all 0.25s ease",
              }}
            />
          </button>

          <button
            onClick={() => {
              setPickFilter(!pickFilter);
              Haptics.light();
            }}
            style={{ width: 52, height: 52, borderRadius: "50%", background: pickFilter ? "rgba(255,214,10,0.95)" : "rgba(0,0,0,0.45)", backdropFilter: "blur(14px)", fontSize: 11, fontWeight: 700, color: pickFilter ? "#111" : "#fff" }}
          >
            FX
          </button>
        </div>
      </div>

      <div style={{ position: "absolute", bottom: 182, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 26, zIndex: 20 }}>
        {(["video", "photo", "portrait"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => {
              if (recording) return;
              Haptics.selection();
              Sfx.tick();
              setMode(m);
            }}
            style={{ fontSize: 13.5, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", color: mode === m ? "#ffd60a" : "rgba(255,255,255,0.65)", opacity: recording && mode !== m ? 0.4 : 1 }}
          >
            {m === "video" ? (lang === "id" ? "Video" : "Video") : m === "photo" ? (lang === "id" ? "Foto" : "Photo") : (lang === "id" ? "Potret" : "Portrait")}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {pickFilter && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            style={{ position: "absolute", bottom: 148, left: 16, right: 16, borderRadius: 18, background: "rgba(20,20,24,0.85)", backdropFilter: "blur(24px)", padding: 14, display: "flex", gap: 14, overflowX: "auto", zIndex: 30 }}
          >
            {FILTERS.map((f) => (
              <button key={f.id} onClick={() => { setFilter(f.id); Haptics.selection(); Sfx.tick(); }} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0 }}>
                <span
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: "50%",
                    background: "linear-gradient(140deg,#ff9f0a,#ff375f,#5e5ce6)",
                    filter: f.css === "none" ? undefined : f.css,
                    border: filter === f.id ? "2.5px solid #ffd60a" : "2.5px solid transparent",
                  }}
                />
                <span style={{ fontSize: 11, color: filter === f.id ? "#ffd60a" : "#fff" }}>{f.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/** close is via home indicator; a small X for quick exit **/}
      <button
        onClick={() => useSystem.getState().closeApp()}
        style={{ position: "absolute", top: 74, left: "50%", transform: "translateX(-50%)", zIndex: 25, width: 34, height: 34, borderRadius: "50%", background: "rgba(0,0,0,0.4)", backdropFilter: "blur(14px)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0 }}
      >
        <Xmark size={16} />
      </button>

      {!ready && !error && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", border: "3px solid rgba(255,255,255,0.25)", borderTopColor: "#fff", animation: "spin 0.8s linear infinite" }} />
        </div>
      )}
    </div>
  );
}
