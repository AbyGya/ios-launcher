import { useEffect, useState } from "react";
import { useLauncher } from "../store/launcher";

function fallbackArt(label: string): string {
  let hash = 0;
  for (let i = 0; i < label.length; i++) hash = (hash * 31 + label.charCodeAt(i)) | 0;
  const hue = Math.abs(hash) % 360;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128'><rect width='128' height='128' rx='30' fill='hsl(${hue} 68% 50%)'/><text x='64' y='86' font-family='Inter,Arial,sans-serif' font-size='56' font-weight='700' fill='white' text-anchor='middle'>${(label[0] ?? "?").toUpperCase()}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function NativeIcon({
  pkg,
  label,
  size,
}: {
  pkg: string;
  label: string;
  size: number;
}) {
  const cached = useLauncher((s) => s.iconCache[pkg]);
  const loadIcon = useLauncher((s) => s.loadIcon);
  const [uri, setUri] = useState(cached ?? "");

  useEffect(() => {
    if (cached) {
      setUri(cached);
      return;
    }
    let alive = true;
    loadIcon(pkg).then((u) => {
      if (alive && u) setUri(u);
    });
    return () => {
      alive = false;
    };
  }, [pkg, cached, loadIcon]);

  return (
    <img
      src={uri || fallbackArt(label)}
      alt=""
      draggable={false}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.235,
        display: "block",
        boxShadow: "0 3px 10px rgba(0,0,0,0.28)",
        objectFit: "cover",
      }}
    />
  );
}
