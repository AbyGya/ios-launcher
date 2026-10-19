import { TRACKS, type Track } from "./tracks";
import { useMedia } from "../store/media";
import { useSettings } from "../store/settings";

const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

class MusicEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private delaySend: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private levelsBuf: Uint8Array<ArrayBuffer> | null = null;
  private timer: number | null = null;
  private posTimer: number | null = null;
  private nextTime = 0;
  private startCtxTime = 0;
  private startPos = 0;
  private track: Track | null = null;
  playing = false;

  private ensure(): AudioContext | null {
    if (typeof window === "undefined") return null;
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    if (!this.ctx) {
      const c = new AC();
      this.ctx = c;
      this.master = c.createGain();
      this.musicGain = c.createGain();
      this.analyser = c.createAnalyser();
      this.analyser.fftSize = 128;
      this.levelsBuf = new Uint8Array(this.analyser.frequencyBinCount);
      const warm = c.createBiquadFilter();
      warm.type = "lowpass";
      warm.frequency.value = 11500;
      const delay = c.createDelay(1);
      delay.delayTime.value = 0.29;
      const fb = c.createGain();
      fb.gain.value = 0.36;
      const dlp = c.createBiquadFilter();
      dlp.type = "lowpass";
      dlp.frequency.value = 1900;
      const wet = c.createGain();
      wet.gain.value = 0.4;
      this.delaySend = c.createGain();
      this.delaySend.connect(delay);
      delay.connect(dlp);
      dlp.connect(fb);
      fb.connect(delay);
      dlp.connect(wet);
      wet.connect(this.musicGain);
      this.musicGain.connect(warm);
      warm.connect(this.analyser);
      this.analyser.connect(this.master);
      this.master.connect(c.destination);
      this.master.gain.value = useSettings.getState().volume;
      const len = c.sampleRate;
      this.noiseBuf = c.createBuffer(1, len, c.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  private tone(
    freq: number,
    t: number,
    dur: number,
    type: OscillatorType,
    peak: number,
    attack: number,
    filterFreq?: number,
    detune = 0,
    send = 0,
    freqEnd?: number,
  ) {
    const c = this.ctx!;
    const o = c.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
    if (detune) o.detune.value = detune;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + dur);
    let node: AudioNode = g;
    if (filterFreq) {
      const f = c.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = filterFreq;
      g.connect(f);
      node = f;
    }
    o.connect(g);
    node.connect(this.musicGain!);
    if (send > 0 && this.delaySend) {
      const s = c.createGain();
      s.gain.value = send;
      node.connect(s);
      s.connect(this.delaySend);
    }
    o.start(t);
    o.stop(t + attack + dur + 0.1);
  }

  private noise(t: number, dur: number, filter: BiquadFilterType, freq: number, peak: number) {
    const c = this.ctx!;
    const src = c.createBufferSource();
    src.buffer = this.noiseBuf!;
    src.loop = true;
    const f = c.createBiquadFilter();
    f.type = filter;
    if (filter !== "lowpass") f.frequency.value = freq;
    else f.frequency.value = freq;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(this.musicGain!);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  private kick(t: number) {
    this.tone(150, t, 0.22, "sine", 0.85, 0.001, undefined, 0, 0, 46);
    this.noise(t, 0.03, "lowpass", 200, 0.25);
  }

  private snare(t: number) {
    this.noise(t, 0.17, "bandpass", 1900, 0.3);
    this.tone(185, t, 0.1, "triangle", 0.18, 0.001);
  }

  private hat(t: number, vel: number) {
    this.noise(t, 0.035, "highpass", 7600, 0.085 * vel);
  }

  private pad(t: number, chord: number[], dur: number) {
    chord.forEach((m) => {
      [0, -7, 6].forEach((det) => {
        const f = mtof(m - 12);
        const c = this.ctx!;
        const o = c.createOscillator();
        o.type = "sawtooth";
        o.frequency.value = f;
        o.detune.value = det;
        const g = c.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.028, t + 0.7);
        g.gain.setValueAtTime(0.028, t + dur - 0.9);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        const lp = c.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.value = 950;
        o.connect(g);
        g.connect(lp);
        lp.connect(this.musicGain!);
        if (this.delaySend) {
          const s = c.createGain();
          s.gain.value = 0.12;
          lp.connect(s);
          s.connect(this.delaySend);
        }
        o.start(t);
        o.stop(t + dur + 0.1);
      });
    });
  }

  private bassNote(t: number, midi: number, dur: number) {
    this.tone(mtof(midi), t, dur, "triangle", 0.32, 0.02, 420);
    this.tone(mtof(midi - 12), t, dur, "sine", 0.22, 0.02, 300);
  }

  private scheduleStep(step: number, t: number) {
    const tr = this.track!;
    const bar = Math.floor(step / 16) % 4;
    const inBar = step % 16;
    const chord = tr.chords[bar];
    const swing = tr.mood === "jazz" || tr.mood === "lofi" ? (inBar % 2 === 1 ? 0.03 : 0) : 0;
    const tt = t + swing;
    if (inBar === 0 || inBar === 8 || (tr.mood === "lofi" && inBar === 11))
      this.kick(tt);
    if (inBar === 4 || inBar === 12) this.snare(tt);
    if (inBar % 2 === 0) this.hat(tt, inBar % 4 === 0 ? 1 : 0.6);
    if (inBar === 0) {
      this.pad(tt, chord, (60 / tr.bpm) * 4 * 0.98);
      this.bassNote(tt, tr.bass[bar], (60 / tr.bpm) * 4 * 0.92);
    }
    const melodyProb = tr.mood === "jazz" ? 0.5 : 0.34;
    if (inBar % 4 === 2 || (inBar % 4 === 3 && Math.random() < melodyProb)) {
      const note = chord[Math.floor(Math.random() * chord.length)] + 12;
      const dur = (60 / tr.bpm) * 0.45;
      this.tone(mtof(note), tt, dur, "triangle", 0.075, 0.01, 3200, 0, 0.5);
    }
  }

  private loop = () => {
    const c = this.ctx;
    if (!c || !this.track || !this.playing) return;
    const sps = (this.track.bpm / 60) * 4;
    while (this.nextTime < c.currentTime + 0.12) {
      const elapsed = this.nextTime - this.startCtxTime;
      const step = Math.floor((this.startPos + elapsed) * sps) % 64;
      this.scheduleStep(step, this.nextTime);
      this.nextTime += 1 / sps;
    }
    this.timer = window.setTimeout(this.loop, 25);
  };

  private emitPosition = () => {
    if (!this.ctx || !this.track) return;
    const pos = this.startPos + (this.ctx.currentTime - this.startCtxTime);
    if (pos >= this.track.duration) {
      this.onEnded();
      return;
    }
    useMedia.getState().set({ position: pos });
  };

  private onEnded() {
    const st = useMedia.getState();
    const tr = this.track;
    if (!tr) return;
    if (st.repeat === "one") {
      this.play(tr.id, 0);
      return;
    }
    this.next();
  }

  next() {
    const st = useMedia.getState();
    const idx = TRACKS.findIndex((t) => t.id === st.currentId);
    let nextIdx: number;
    if (st.shuffle) {
      do {
        nextIdx = Math.floor(Math.random() * TRACKS.length);
      } while (nextIdx === idx && TRACKS.length > 1);
    } else {
      nextIdx = (idx + 1) % TRACKS.length;
    }
    this.play(TRACKS[nextIdx].id, 0);
  }

  prev() {
    const st = useMedia.getState();
    if (st.position > 4) {
      this.seek(0);
      return;
    }
    const idx = TRACKS.findIndex((t) => t.id === st.currentId);
    const prevIdx = (idx - 1 + TRACKS.length) % TRACKS.length;
    this.play(TRACKS[prevIdx].id, 0);
  }

  play(trackId: string, from = 0) {
    const c = this.ensure();
    if (!c) return;
    const tr = TRACKS.find((t) => t.id === trackId);
    if (!tr) return;
    this.track = tr;
    this.playing = true;
    this.startPos = from;
    this.startCtxTime = c.currentTime + 0.08;
    this.nextTime = this.startCtxTime;
    if (this.timer) window.clearTimeout(this.timer);
    if (this.posTimer) window.clearInterval(this.posTimer);
    this.loop();
    this.posTimer = window.setInterval(this.emitPosition, 250);
    useMedia.getState().set({ currentId: trackId, playing: true, position: from });
  }

  pause() {
    this.playing = false;
    if (this.timer) window.clearTimeout(this.timer);
    if (this.posTimer) window.clearInterval(this.posTimer);
    if (this.ctx && this.track) {
      this.startPos += this.ctx.currentTime - this.startCtxTime;
      useMedia.getState().set({ playing: false, position: this.startPos });
    }
  }

  resume() {
    const st = useMedia.getState();
    if (st.currentId) this.play(st.currentId, st.position);
  }

  toggle() {
    if (this.playing) this.pause();
    else if (useMedia.getState().currentId) this.resume();
    else this.play(TRACKS[0].id, 0);
  }

  seek(pos: number) {
    const st = useMedia.getState();
    if (!st.currentId) return;
    if (this.playing) this.play(st.currentId, pos);
    else useMedia.getState().set({ position: pos });
  }

  setVolume(v: number) {
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05);
    }
  }

  levels(): number[] {
    if (!this.analyser || !this.levelsBuf || !this.playing) return new Array(12).fill(0);
    this.analyser.getByteFrequencyData(this.levelsBuf);
    const bars: number[] = [];
    const n = this.levelsBuf.length;
    for (let i = 0; i < 12; i++) {
      const start = Math.floor((i / 12) * n * 0.7);
      const end = Math.max(start + 1, Math.floor(((i + 1) / 12) * n * 0.7));
      let sum = 0;
      for (let j = start; j < end; j++) sum += this.levelsBuf[j];
      bars.push(Math.min(1, sum / (end - start) / 220));
    }
    return bars;
  }
}

export const engine = new MusicEngine();

useSettings.subscribe((s, prev) => {
  if (s.volume !== prev.volume) engine.setVolume(s.volume);
});
