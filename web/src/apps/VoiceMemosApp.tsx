import { useEffect, useRef, useState } from "react";
import { get as idbGet, set as idbSet, del as idbDel } from "idb-keyval";
import { useT } from "../i18n";
import { useSettings } from "../store/settings";
import { useLocalState } from "../lib/useLocalState";
import { useIsland } from "../store/island";
import { Sfx } from "../lib/sfx";
import { Haptics } from "../lib/haptics";
import { fmtTime, relTime } from "../lib/util";
import { NavBar, showAlert } from "../components/ui/surfaces";
import { Mic, Pause, Play, Trash } from "../icons/Sys";

function ProgressMeter({ value, onSeek }: { value: number; onSeek: (v: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const seek = (clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    onSeek(Math.min(1, Math.max(0, (clientX - r.left) / r.width)));
  };
  return (
    <div
      ref={ref}
      onPointerDown={(e) => {
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
        seek(e.clientX);
      }}
      onPointerMove={(e) => {
        if (e.buttons > 0) seek(e.clientX);
      }}
      style={{ flex: 1, height: 28, display: "flex", alignItems: "center", cursor: "pointer", touchAction: "none" }}
    >
      <div style={{ width: "100%", height: 5, borderRadius: 3, background: "rgba(120,120,128,0.3)", overflow: "hidden" }}>
        <div style={{ width: `${Math.round(value * 100)}%`, height: "100%", background: "#ff453a" }} />
      </div>
    </div>
  );
}

interface Rec {
  id: string;
  name: string;
  secs: number;
  ts: number;
}

const BAR_COUNT = 30;

export default function VoiceMemosApp() {
  const t = useT();
  const lang = useSettings((s) => s.lang);
  const [recs, setRecs] = useLocalState<Rec[]>("memos", []);
  const [recording, setRecording] = useState(false);
  const [secs, setSecs] = useState(0);
  const [bars, setBars] = useState<number[]>(() => Array(BAR_COUNT).fill(0.08));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);

  const streamRef = useRef<MediaStream | null>(null);
  const mrRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const acRef = useRef<AudioContext | null>(null);
  const rafRef = useRef(0);
  const tickRef = useRef(0);
  const secsRef = useRef(0);
  const islandIdRef = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const recordingRef = useRef(false);

  useEffect(() => {
    recordingRef.current = recording;
  }, [recording]);

  useEffect(() => {
    const unsub = useIsland.subscribe(() => {
      if (recordingRef.current && !useIsland.getState().getByKind("recording")) {
        stopRecording();
      }
    });
    return () => {
      unsub();
      if (recordingRef.current) stopRecordingRef.current?.(true);
      stopAudio();
      teardown();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    setPlaying(false);
    setPos(0);
  };

  const teardown = () => {
    cancelAnimationFrame(rafRef.current);
    if (mrRef.current && mrRef.current.state !== "inactive") {
      try {
        mrRef.current.stop();
      } catch {
        void 0;
      }
    }
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    if (acRef.current) {
      void acRef.current.close();
      acRef.current = null;
    }
    analyserRef.current = null;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.start(200);
      mrRef.current = mr;

      const ac = new AudioContext();
      acRef.current = ac;
      const src = ac.createMediaStreamSource(stream);
      const analyser = ac.createAnalyser();
      analyser.fftSize = 512;
      src.connect(analyser);
      analyserRef.current = analyser;
      const data = new Uint8Array(analyser.fftSize);

      const loop = () => {
        rafRef.current = requestAnimationFrame(loop);
        const a = analyserRef.current;
        if (!a) return;
        a.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const level = Math.min(1, Math.sqrt(sum / data.length) * 3.2);
        tickRef.current++;
        if (tickRef.current % 6 === 0) {
          setBars((prev) => [...prev.slice(1), Math.max(0.06, level)]);
        }
      };
      loop();

      secsRef.current = 0;
      setSecs(0);
      const timer = window.setInterval(() => {
        secsRef.current++;
        setSecs(secsRef.current);
      }, 1000);
      timerRef.current = timer;

      islandIdRef.current = useIsland.getState().add({ kind: "recording", title: t("voicememos.title") });
      setRecording(true);
      Haptics.medium();
      Sfx.click();
    } catch {
      Sfx.error();
      Haptics.error();
      void showAlert({ title: t("voicememos.denied"), message: "", buttons: [t("common.ok")] });
    }
  };

  const timerRef = useRef(0);

  const stopRecording = (silent = false) => {
    recordingRef.current = false;
    window.clearInterval(timerRef.current);
    cancelAnimationFrame(rafRef.current);
    const mr = mrRef.current;
    const total = secsRef.current;
    if (mr && mr.state !== "inactive") {
      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        const id = `m${Date.now()}`;
        const idx = recsRef.current.length + 1;
        try {
          await idbSet(`ip17-vm-${id}`, blob);
        } catch {
          void 0;
        }
        setRecs((prev) => [{ id, name: `${t("voicememos.title")} ${idx}`, secs: Math.max(1, total), ts: Date.now() }, ...prev]);
      };
      mr.stop();
    }
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    if (acRef.current) {
      void acRef.current.close();
      acRef.current = null;
    }
    analyserRef.current = null;
    const islandId = islandIdRef.current;
    islandIdRef.current = null;
    if (islandId) useIsland.getState().remove(islandId);
    setRecording(false);
    setBars(Array(BAR_COUNT).fill(0.08));
    secsRef.current = 0;
    if (!silent) {
      Haptics.medium();
      Sfx.tick();
    }
  };

  const stopRecordingRef = useRef(stopRecording);
  stopRecordingRef.current = stopRecording;

  const recsRef = useRef(recs);
  useEffect(() => {
    recsRef.current = recs;
  }, [recs]);

  const toggleRec = () => {
    if (recording) stopRecording();
    else void startRecording();
  };

  const play = async (rec: Rec) => {
    if (selectedId === rec.id && playing && audioRef.current) {
      audioRef.current.pause();
      setPlaying(false);
      return;
    }
    stopAudio();
    setSelectedId(rec.id);
    const blob = (await idbGet(`ip17-vm-${rec.id}`)) as Blob | undefined;
    if (!blob) {
      void showAlert({ title: t("voicememos.empty"), message: "", buttons: [t("common.ok")] });
      return;
    }
    const url = URL.createObjectURL(blob);
    urlRef.current = url;
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.ontimeupdate = () => setPos(audio.currentTime);
    audio.onended = () => {
      setPlaying(false);
      setPos(0);
    };
    await audio.play();
    setPlaying(true);
  };

  const remove = (rec: Rec) => {
    if (selectedId === rec.id) stopAudio();
    void idbDel(`ip17-vm-${rec.id}`);
    setRecs((prev) => prev.filter((r) => r.id !== rec.id));
    Sfx.whoosh();
    Haptics.light();
  };

  return (
    <div style={{ position: "absolute", inset: 0, background: "var(--app-bg)" }}>
      <div className="scroll-y" id="app-scroll" style={{ position: "absolute", inset: 0, paddingTop: 0, paddingBottom: 210 }}>
        <NavBar title={t("voicememos.title")} />
        {recs.length === 0 && !recording ? (
          <div style={{ padding: "110px 40px", textAlign: "center" }}>
            <div style={{ width: 74, height: 74, borderRadius: 22, background: "rgba(255,69,58,0.14)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
              <Mic size={34} color="#ff453a" strokeWidth={1.9} />
            </div>
            <div style={{ fontSize: 19, fontWeight: 700 }}>{t("voicememos.empty")}</div>
            <div style={{ fontSize: 14.5, opacity: 0.55, marginTop: 8 }}>{t("voicememos.record")}</div>
          </div>
        ) : (
          <div style={{ margin: "4px 16px 0", borderRadius: 12, background: "var(--card)", overflow: "hidden" }}>
            {recs.map((r, i) => (
              <div key={r.id} className={i > 0 ? "list-sep" : undefined}>
                <button onClick={() => void play(r)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", textAlign: "left" }}>
                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(120,120,128,0.18)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {selectedId === r.id && playing ? <Pause size={15} strokeWidth={2.2} /> : <Play size={15} strokeWidth={2.2} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.name}</div>
                    <div style={{ fontSize: 12.5, opacity: 0.5 }}>
                      {relTime(r.ts, lang)} · {fmtTime(r.secs)}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      remove(r);
                    }}
                    style={{ width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", color: "#ff453a", flexShrink: 0 }}
                  >
                    <Trash size={17} strokeWidth={2.1} />
                  </button>
                </button>
                {selectedId === r.id && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "2px 16px 12px" }}>
                    <span style={{ fontSize: 11.5, opacity: 0.5, width: 36, fontVariantNumeric: "tabular-nums" }}>{fmtTime(Math.floor(pos))}</span>
                    <ProgressMeter
                      value={r.secs > 0 ? Math.min(1, pos / r.secs) : 0}
                      onSeek={(v) => {
                        if (audioRef.current) audioRef.current.currentTime = v * r.secs;
                        setPos(v * r.secs);
                      }}
                    />
                    <span style={{ fontSize: 11.5, opacity: 0.5, width: 36, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmtTime(r.secs)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 40, paddingBottom: 44, pointerEvents: "none" }}>
        <div style={{ height: 120, display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 3, padding: "0 24px", marginBottom: 14 }}>
          {bars.map((b, i) => (
            <div
              key={i}
              style={{
                width: 3.5,
                height: `${Math.round(b * 86)}px`,
                borderRadius: 2,
                background: recording ? (secs < 30 ? "#ff453a" : "#ff453a") : "rgba(120,120,128,0.35)",
                transition: "height 0.12s linear",
                opacity: recording ? 1 : 0.45,
              }}
            />
          ))}
        </div>
        <div style={{ textAlign: "center", fontSize: 15, fontWeight: 600, fontVariantNumeric: "tabular-nums", marginBottom: 10, opacity: recording ? 1 : 0.55, color: recording ? "#ff453a" : undefined }}>
          {fmtTime(recording ? secs : 0)}
        </div>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <button
            onClick={toggleRec}
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              border: "5px solid #ff453a",
              background: recording ? "#ff453a" : "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "auto",
            }}
          >
            {recording ? <div style={{ width: 22, height: 22, borderRadius: 6, background: "#fff" }} /> : <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#ff453a" }} />}
          </button>
        </div>
        <div style={{ textAlign: "center", fontSize: 13.5, opacity: 0.6, marginTop: 8 }}>{recording ? t("voicememos.stop") : t("voicememos.record")}</div>
      </div>
    </div>
  );
}
