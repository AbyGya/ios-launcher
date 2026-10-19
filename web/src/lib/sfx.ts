import { useSettings } from "../store/settings";

let ctx: AudioContext | null = null;
let noiseBuf: AudioBuffer | null = null;
let master: GainNode | null = null;

function ensure(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AC) return null;
  if (!ctx) {
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
    const len = ctx.sampleRate * 1;
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function unlockAudio() {
  ensure();
}

function enabled(): boolean {
  return useSettings.getState().sounds;
}

function env(
  c: AudioContext,
  t0: number,
  peak: number,
  attack: number,
  decay: number,
): GainNode {
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(peak, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + decay);
  return g;
}

function noise(c: AudioContext, t0: number, dur: number): AudioBufferSourceNode {
  const src = c.createBufferSource();
  src.buffer = noiseBuf!;
  src.loop = true;
  src.start(t0);
  src.stop(t0 + dur);
  return src;
}

function tone(
  c: AudioContext,
  freq: number,
  t0: number,
  dur: number,
  type: OscillatorType = "sine",
  peak = 0.15,
  attack = 0.004,
  freqEnd?: number,
): OscillatorNode {
  const o = c.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, t0 + dur);
  const g = env(c, t0, peak, attack, dur);
  o.connect(g).connect(master!);
  o.start(t0);
  o.stop(t0 + attack + dur + 0.05);
  return o;
}

function bandNoise(
  c: AudioContext,
  t0: number,
  dur: number,
  freq: number,
  q: number,
  peak: number,
  freqEnd?: number,
) {
  const src = noise(c, t0, dur);
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.setValueAtTime(freq, t0);
  if (freqEnd) bp.frequency.exponentialRampToValueAtTime(freqEnd, t0 + dur);
  bp.Q.value = q;
  const g = env(c, t0, peak, 0.003, dur);
  src.connect(bp).connect(g).connect(master!);
}

function now(c: AudioContext): number {
  return c.currentTime + 0.005;
}

export const Sfx = {
  tick() {
    if (!enabled()) return;
    const c = ensure();
    if (!c) return;
    const t = now(c);
    bandNoise(c, t, 0.02, 3000, 8, 0.06);
  },
  click() {
    if (!enabled()) return;
    const c = ensure();
    if (!c) return;
    const t = now(c);
    bandNoise(c, t, 0.03, 2400, 6, 0.12);
    tone(c, 1800, t, 0.02, "square", 0.02);
  },
  tap() {
    if (!enabled()) return;
    const c = ensure();
    if (!c) return;
    const t = now(c);
    bandNoise(c, t, 0.015, 2000, 10, 0.05);
  },
  lock() {
    if (!enabled()) return;
    const c = ensure();
    if (!c) return;
    const t = now(c);
    tone(c, 900, t, 0.08, "sine", 0.09, 0.004, 500);
    bandNoise(c, t, 0.04, 1400, 4, 0.05);
  },
  unlock() {
    if (!enabled()) return;
    const c = ensure();
    if (!c) return;
    const t = now(c);
    tone(c, 500, t, 0.09, "sine", 0.09, 0.004, 1000);
    bandNoise(c, t, 0.05, 1800, 4, 0.05);
  },
  shutter() {
    if (!enabled()) return;
    const c = ensure();
    if (!c) return;
    const t = now(c);
    bandNoise(c, t, 0.05, 1200, 2, 0.28);
    bandNoise(c, t + 0.06, 0.03, 4200, 3, 0.18);
    tone(c, 220, t, 0.05, "square", 0.05);
  },
  send() {
    if (!enabled()) return;
    const c = ensure();
    if (!c) return;
    const t = now(c);
    bandNoise(c, t, 0.28, 500, 2, 0.1, 3200);
    tone(c, 1300, t + 0.02, 0.1, "sine", 0.05, 0.004, 1900);
  },
  receive() {
    if (!enabled()) return;
    const c = ensure();
    if (!c) return;
    const t = now(c);
    tone(c, 1046, t, 0.28, "sine", 0.12);
    tone(c, 1568, t + 0.09, 0.32, "sine", 0.1);
  },
  ding() {
    if (!enabled()) return;
    const c = ensure();
    if (!c) return;
    const t = now(c);
    tone(c, 880, t, 0.5, "sine", 0.12);
    tone(c, 1760, t, 0.4, "sine", 0.04);
  },
  dtmf(freqs: [number, number]) {
    if (!enabled()) return;
    const c = ensure();
    if (!c) return;
    const t = now(c);
    tone(c, freqs[0], t, 0.14, "sine", 0.07);
    tone(c, freqs[1], t, 0.14, "sine", 0.07);
  },
  error() {
    if (!enabled()) return;
    const c = ensure();
    if (!c) return;
    const t = now(c);
    tone(c, 220, t, 0.12, "square", 0.06);
    tone(c, 180, t + 0.13, 0.18, "square", 0.06);
  },
  timerDone() {
    if (!enabled()) return;
    const c = ensure();
    if (!c) return;
    const t = now(c);
    const notes = [659, 784, 988, 1319];
    notes.forEach((f, i) => {
      tone(c, f, t + i * 0.16, 0.6, "sine", 0.14);
      tone(c, f * 2, t + i * 0.16, 0.4, "sine", 0.03);
    });
  },
  alarm() {
    if (!enabled()) return;
    const c = ensure();
    if (!c) return;
    const t = now(c);
    for (let i = 0; i < 8; i++) {
      tone(c, 880, t + i * 0.28, 0.1, "sine", 0.16);
      tone(c, 660, t + i * 0.28 + 0.14, 0.1, "sine", 0.14);
    }
  },
  whoosh(up = true) {
    if (!enabled()) return;
    const c = ensure();
    if (!c) return;
    const t = now(c);
    bandNoise(c, t, 0.3, up ? 500 : 2400, 1.5, 0.05, up ? 2400 : 300);
  },
  pay() {
    if (!enabled()) return;
    const c = ensure();
    if (!c) return;
    const t = now(c);
    tone(c, 1318, t, 0.16, "sine", 0.12);
    tone(c, 1975, t + 0.12, 0.5, "sine", 0.12);
  },
};
