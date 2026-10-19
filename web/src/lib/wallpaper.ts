import { seededRandom } from "./util";

const cache = new Map<string, string>();

function makeCanvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

function blobs(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  specs: Array<[number, number, number, string]>,
  blur = 90,
) {
  ctx.save();
  ctx.filter = `blur(${blur}px)`;
  for (const [x, y, r, color] of specs) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x * w, y * h, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function vignette(ctx: CanvasRenderingContext2D, w: number, h: number, strength = 0.5) {
  const g = ctx.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, h * 0.72);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, `rgba(0,0,0,${strength})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

export function generateWallpaper(id: string): string {
  const hit = cache.get(id);
  if (hit) return hit;
  const w = 880;
  const h = 1912;
  const c = makeCanvas(w, h);
  const ctx = c.getContext("2d")!;
  const rnd = seededRandom(id.length * 7919 + 13);

  if (id === "cosmic") {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#170905");
    g.addColorStop(0.5, "#0b0402");
    g.addColorStop(1, "#1a0a04");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    blobs(ctx, w, h, [
      [0.2, 0.24, 300, "rgba(255,120,40,0.85)"],
      [0.78, 0.16, 260, "rgba(255,60,30,0.6)"],
      [0.55, 0.42, 340, "rgba(200,60,120,0.45)"],
      [0.15, 0.62, 300, "rgba(255,150,60,0.5)"],
      [0.85, 0.7, 280, "rgba(120,40,160,0.45)"],
      [0.4, 0.88, 320, "rgba(255,90,40,0.35)"],
    ]);
    ctx.globalCompositeOperation = "overlay";
    const sheen = ctx.createLinearGradient(0, 0, w, h);
    sheen.addColorStop(0, "rgba(255,200,150,0.25)");
    sheen.addColorStop(0.5, "rgba(255,255,255,0)");
    sheen.addColorStop(1, "rgba(255,120,50,0.2)");
    ctx.fillStyle = sheen;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = "source-over";
    vignette(ctx, w, h, 0.55);
  } else if (id === "dusk") {
    const sky = ctx.createLinearGradient(0, 0, 0, h * 0.75);
    sky.addColorStop(0, "#2b1b4d");
    sky.addColorStop(0.45, "#a34a6b");
    sky.addColorStop(0.72, "#f08a4b");
    sky.addColorStop(1, "#ffd08a");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);
    const sun = ctx.createRadialGradient(w * 0.62, h * 0.62, 10, w * 0.62, h * 0.62, 300);
    sun.addColorStop(0, "rgba(255,230,170,0.95)");
    sun.addColorStop(0.5, "rgba(255,180,90,0.35)");
    sun.addColorStop(1, "rgba(255,180,90,0)");
    ctx.fillStyle = sun;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#1c1030";
    ctx.beginPath();
    ctx.moveTo(0, h * 0.72);
    ctx.lineTo(w * 0.2, h * 0.6);
    ctx.lineTo(w * 0.4, h * 0.7);
    ctx.lineTo(w * 0.62, h * 0.57);
    ctx.lineTo(w * 0.85, h * 0.7);
    ctx.lineTo(w, h * 0.62);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#0d0818";
    ctx.beginPath();
    ctx.moveTo(0, h * 0.82);
    ctx.lineTo(w * 0.28, h * 0.7);
    ctx.lineTo(w * 0.5, h * 0.8);
    ctx.lineTo(w * 0.72, h * 0.68);
    ctx.lineTo(w, h * 0.8);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();
    for (let i = 0; i < 90; i++) {
      const y = rnd() * h * 0.4;
      ctx.fillStyle = `rgba(255,255,255,${0.15 + rnd() * 0.5})`;
      ctx.fillRect(rnd() * w, y, 2, 2);
    }
  } else if (id === "ocean") {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#031d33");
    g.addColorStop(0.4, "#062c4a");
    g.addColorStop(1, "#01111f");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    blobs(ctx, w, h, [
      [0.3, 0.3, 260, "rgba(30,120,200,0.5)"],
      [0.75, 0.5, 300, "rgba(20,80,160,0.45)"],
      [0.4, 0.75, 320, "rgba(40,150,220,0.3)"],
    ], 70);
    ctx.strokeStyle = "rgba(160,220,255,0.14)";
    for (let i = 0; i < 26; i++) {
      ctx.lineWidth = 1 + rnd() * 2;
      ctx.beginPath();
      const y0 = h * (0.1 + 0.85 * rnd());
      ctx.moveTo(-40, y0);
      for (let x = 0; x <= w + 40; x += 60) {
        ctx.lineTo(x, y0 + Math.sin(x / 90 + i) * (14 + rnd() * 22));
      }
      ctx.stroke();
    }
    vignette(ctx, w, h, 0.5);
  } else if (id === "bloom") {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#2a1038");
    g.addColorStop(1, "#12061c");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    blobs(ctx, w, h, [
      [0.3, 0.22, 280, "rgba(255,110,180,0.55)"],
      [0.75, 0.35, 300, "rgba(170,110,255,0.5)"],
      [0.45, 0.6, 340, "rgba(255,150,200,0.35)"],
      [0.2, 0.85, 260, "rgba(130,90,255,0.4)"],
      [0.8, 0.8, 280, "rgba(255,90,160,0.3)"],
    ]);
    vignette(ctx, w, h, 0.45);
  } else if (id === "aurora") {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#03110f");
    g.addColorStop(0.5, "#041d1c");
    g.addColorStop(1, "#020a14");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.filter = "blur(70px)";
    for (let i = 0; i < 7; i++) {
      const x = w * (0.1 + rnd() * 0.8);
      const hue = [160, 190, 280, 130][Math.floor(rnd() * 4)];
      ctx.strokeStyle = `hsla(${hue}, 90%, 55%, ${0.25 + rnd() * 0.3})`;
      ctx.lineWidth = 60 + rnd() * 120;
      ctx.beginPath();
      ctx.moveTo(x, -50);
      ctx.bezierCurveTo(x + 150, h * 0.3, x - 180, h * 0.55, x + 60, h + 50);
      ctx.stroke();
    }
    ctx.restore();
    for (let i = 0; i < 120; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.2 + rnd() * 0.6})`;
      ctx.fillRect(rnd() * w, rnd() * h * 0.7, 2, 2);
    }
    vignette(ctx, w, h, 0.5);
  } else {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#232329");
    g.addColorStop(0.5, "#0f0f13");
    g.addColorStop(1, "#1a1a20");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    blobs(ctx, w, h, [
      [0.5, 0.3, 320, "rgba(120,120,130,0.25)"],
      [0.5, 0.85, 340, "rgba(80,80,90,0.25)"],
    ]);
    vignette(ctx, w, h, 0.6);
  }
  const url = c.toDataURL("image/jpeg", 0.9);
  cache.set(id, url);
  return url;
}

export function generatePhoto(seed: number): string {
  const key = `photo-${seed}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const w = 600;
  const h = 800;
  const c = makeCanvas(w, h);
  const ctx = c.getContext("2d")!;
  const rnd = seededRandom(seed * 104729 + 7);
  const kind = seed % 4;
  const hue = (seed * 47) % 360;

  if (kind === 0) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, `hsl(${hue}, 65%, 60%)`);
    g.addColorStop(1, `hsl(${(hue + 60) % 360}, 55%, 25%)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = `hsla(${(hue + 180) % 360}, 80%, 65%, 0.85)`;
    ctx.beginPath();
    ctx.arc(w * (0.3 + rnd() * 0.4), h * (0.2 + rnd() * 0.3), 60 + rnd() * 50, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(10,10,20,0.85)";
    ctx.beginPath();
    ctx.moveTo(0, h * 0.78);
    ctx.lineTo(w * 0.3, h * 0.62);
    ctx.lineTo(w * 0.55, h * 0.76);
    ctx.lineTo(w * 0.8, h * 0.6);
    ctx.lineTo(w, h * 0.74);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();
  } else if (kind === 1) {
    ctx.fillStyle = `hsl(${hue}, 30%, ${12 + rnd() * 10}%)`;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) {
      ctx.strokeStyle = `hsla(${(hue + i * 8) % 360}, 70%, 60%, ${0.1 + rnd() * 0.4})`;
      ctx.lineWidth = 2 + rnd() * 14;
      ctx.beginPath();
      ctx.moveTo(rnd() * w, 0);
      ctx.bezierCurveTo(rnd() * w, h * 0.3, rnd() * w, h * 0.7, rnd() * w, h);
      ctx.stroke();
    }
  } else if (kind === 2) {
    const g = ctx.createRadialGradient(w / 2, h / 2, 40, w / 2, h / 2, h * 0.7);
    g.addColorStop(0, `hsl(${hue}, 85%, 70%)`);
    g.addColorStop(0.5, `hsl(${(hue + 40) % 360}, 70%, 40%)`);
    g.addColorStop(1, "#0a0a0f");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 90; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.2 + rnd() * 0.7})`;
      ctx.fillRect(rnd() * w, rnd() * h, 2, 2);
    }
  } else {
    ctx.fillStyle = `hsl(${hue}, 20%, 92%)`;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 14; i++) {
      ctx.fillStyle = `hsla(${(hue + i * 26) % 360}, 75%, 55%, 0.85)`;
      ctx.beginPath();
      ctx.ellipse(
        w * (0.15 + rnd() * 0.7),
        h * (0.15 + rnd() * 0.7),
        30 + rnd() * 90,
        30 + rnd() * 90,
        rnd() * Math.PI,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  }
  const url = c.toDataURL("image/jpeg", 0.82);
  cache.set(key, url);
  return url;
}

export function gradientFor(hue: number, hue2: number): string {
  return `linear-gradient(145deg, hsl(${hue}, 80%, 58%), hsl(${hue2}, 75%, 38%))`;
}
