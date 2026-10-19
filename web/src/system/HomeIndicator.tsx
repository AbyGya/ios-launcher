import { useRef } from "react";
import { useSystem } from "../store/system";
import { useIsland } from "../store/island";
import { Sfx } from "../lib/sfx";
import { Haptics } from "../lib/haptics";

export function HomeIndicator() {
  const theme = useSystem((s) => s.orientation);
  const press = useRef<{ y: number; t: number } | null>(null);
  const swiped = useRef(false);

  const doHome = () => {
    const st = useSystem.getState();
    Sfx.tick();
    useIsland.getState().expand(null);
    if (st.appSwitcher) return useSystem.setState({ appSwitcher: false });
    if (st.spotlight) return useSystem.setState({ spotlight: false });
    if (st.controlCenter) return useSystem.setState({ controlCenter: false });
    if (st.notificationCenter) return useSystem.setState({ notificationCenter: false });
    if (st.jiggle) return useSystem.setState({ jiggle: false });
    if (st.currentApp) st.closeApp();
  };

  const onDown = (e: React.PointerEvent) => {
    press.current = { y: e.clientY, t: Date.now() };
    swiped.current = false;
    const move = (ev: PointerEvent) => {
      if (!press.current) return;
      const dy = press.current.y - ev.clientY;
      if (dy > 90) {
        const st = useSystem.getState();
        const held = Date.now() - press.current.t > 320;
        useIsland.getState().expand(null);
        if (st.controlCenter || st.notificationCenter || st.spotlight) {
          useSystem.setState({ controlCenter: false, notificationCenter: false, spotlight: false });
        } else if (st.appSwitcher) {
          useSystem.setState({ appSwitcher: false });
        } else if (st.jiggle) {
          useSystem.setState({ jiggle: false });
        } else if (st.currentApp) {
          if (held) {
            Haptics.medium();
            useSystem.setState({ appSwitcher: true, currentApp: null });
          } else {
            st.closeApp();
          }
        } else if (held) {
          useSystem.setState({ appSwitcher: true });
        }
        Sfx.whoosh(false);
        swiped.current = true;
        cleanup();
      }
    };
    const up = () => cleanup();
    const cleanup = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      press.current = null;
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <button
      aria-label="Home"
      onPointerDown={onDown}
      onClick={() => {
        if (!swiped.current) doHome();
        swiped.current = false;
      }}
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 34,
        zIndex: 212,
        background: "transparent",
        border: "none",
        padding: 0,
        touchAction: "none",
      }}
    >
      <span
        className="home-indicator"
        style={{ background: theme === "landscape" ? "rgba(255,255,255,0.9)" : undefined }}
      />
    </button>
  );
}
