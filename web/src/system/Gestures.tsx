import { useRef, type CSSProperties } from "react";
import { useSystem } from "../store/system";
import { useIsland } from "../store/island";
import { Sfx } from "../lib/sfx";
import { Haptics } from "../lib/haptics";

const zoneBase: CSSProperties = {
  position: "absolute",
  zIndex: 135,
  touchAction: "none",
};

export function Gestures() {
  const start = useRef<{ y: number; t: number } | null>(null);

  const onTopDown = (side: "left" | "right") => (e: React.PointerEvent) => {
    start.current = { y: e.clientY, t: Date.now() };
    const move = (ev: PointerEvent) => {
      if (!start.current) return;
      const dy = ev.clientY - start.current.y;
      if (dy > 46 && !useSystem.getState().controlCenter && !useSystem.getState().notificationCenter) {
        Haptics.medium();
        Sfx.whoosh(false);
        useSystem.setState(
          side === "left" ? { notificationCenter: true, controlCenter: false } : { controlCenter: true, notificationCenter: false },
        );
        cleanup();
      }
    };
    const up = () => cleanup();
    const cleanup = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      start.current = null;
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const locked = useSystem((s) => s.locked);
  const booted = useSystem((s) => s.booted);

  if (!booted) return null;

  return (
    <>
      <div
        style={{ ...zoneBase, top: 0, left: 0, width: 152, height: 22 }}
        onPointerDown={locked ? undefined : onTopDown("left")}
      />
      <div
        style={{ ...zoneBase, top: 0, right: 0, width: 152, height: 22 }}
        onPointerDown={locked ? undefined : onTopDown("right")}
      />
    </>
  );
}
