export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

export const pad2 = (n: number) => String(n).padStart(2, "0");

export function fmtTime(sec: number): string {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${pad2(s)}`;
}

export function fmtDurationLong(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}:${pad2(m)}:${pad2(s)}`;
  return `${m}:${pad2(s)}`;
}

export function fmtClock(d: Date): string {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function fmtHourLabel(d: Date): string {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function relTime(ts: number, lang: "id" | "en"): string {
  const diff = Math.max(0, Date.now() - ts);
  const m = Math.floor(diff / 60000);
  if (m < 1) return lang === "id" ? "sekarang" : "now";
  if (m < 60) return lang === "id" ? `${m} mnt lalu` : `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return lang === "id" ? `${h} j lalu` : `${h}h ago`;
  const d = Math.floor(h / 24);
  return lang === "id" ? `${d} hari lalu` : `${d}d ago`;
}

export function hashCode(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function seededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function useDocHeight() {
  return typeof window !== "undefined" ? window.innerHeight : 800;
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function avatarGradient(hue: number): string {
  return `linear-gradient(145deg, hsl(${hue}, 70%, 62%), hsl(${(hue + 40) % 360}, 75%, 46%))`;
}
