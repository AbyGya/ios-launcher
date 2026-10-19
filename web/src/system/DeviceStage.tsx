import { useEffect, useRef, type ReactNode } from "react";
import { useSystem } from "../store/system";
import { useSettings } from "../store/settings";
import { Sfx } from "../lib/sfx";
import { Haptics } from "../lib/haptics";
import { isLauncher } from "../native/bridge";

function SideButton({
  style,
  onClick,
  title,
}: {
  style: React.CSSProperties;
  onClick?: () => void;
  title?: string;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="device-frame-btn"
      style={{ border: "none", padding: 0, ...style }}
    />
  );
}

export function DeviceStage({ children }: { children: ReactNode }) {
  const color = useSettings((s) => s.deviceColor);
  const brightness = useSettings((s) => s.brightness);
  const lowPower = useSettings((s) => s.lowPower);
  const orientation = useSystem((s) => s.orientation);
  const stageRef = useRef<HTMLDivElement>(null);
  const scalerRef = useRef<HTMLDivElement>(null);

  const landscape = orientation === "landscape";

  useEffect(() => {
    const update = () => {
      if (isLauncher) {
        const scale = window.innerWidth / 440;
        scalerRef.current?.style.setProperty("--lscale", String(scale));
        scalerRef.current?.style.setProperty("--lheight", `${window.innerHeight / scale}px`);
        return;
      }
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const w = landscape ? 956 + 32 : 440 + 32;
      const h = landscape ? 440 + 460 : 956 + 40;
      const scale = Math.min((vw - 48) / w, (vh - 48) / (landscape ? 440 + 126 : h));
      scalerRef.current?.style.setProperty("--scale", String(Math.min(scale, 1.15)));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [landscape]);

  const extras = (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "#000",
          opacity: (1 - brightness) * 0.92,
          pointerEvents: "none",
          zIndex: 500,
          transition: "opacity 0.3s ease",
        }}
      />
      {lowPower && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: "#ffd60a",
            zIndex: 501,
            pointerEvents: "none",
          }}
        />
      )}
    </>
  );

  if (isLauncher) {
    return (
      <div className="stage launcher" ref={stageRef}>
        <div className="scaler launcher-scaler" ref={scalerRef}>
          <div className="device launcher-device">
            <div className="screen launcher-screen">
              {children}
              {extras}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="stage" ref={stageRef}>
      <div className="scaler" ref={scalerRef}>
        <div
          className={`device device-${color}`}
          style={{ ["--stage-rotate" as string]: landscape ? "90deg" : "0deg" }}
        >
          <SideButton
            title="Aksi"
            style={{ left: -3, top: 168, width: 4, height: 32, borderRadius: 3 }}
            onClick={() => {
              Sfx.tick();
            }}
          />
          <SideButton title="Volume +" style={{ left: -3, top: 230, width: 4, height: 60 }} onClick={() => Sfx.tick()} />
          <SideButton title="Volume −" style={{ left: -3, top: 306, width: 4, height: 60 }} onClick={() => Sfx.tick()} />
          <SideButton
            title="Tombol Samping"
            style={{ right: -3, top: 250, width: 4, height: 110 }}
            onClick={() => {
              const sys = useSystem.getState();
              if (!sys.booted) return;
              if (sys.locked) {
                Haptics.medium();
                Sfx.lock();
                useSystem.setState({ alwaysOn: !sys.alwaysOn });
              } else {
                Haptics.medium();
                Sfx.lock();
                sys.lockDevice();
              }
            }}
          />
          <SideButton
            title="Kamera Kontrol"
            style={{ right: -3, top: 150, width: 4, height: 34 }}
            onClick={() => {
              Sfx.click();
              useSystem.getState().launchApp("camera");
            }}
          />
          <div className={`screen ${landscape ? "landscape" : ""}`}>
            {children}
            {extras}
          </div>
        </div>
      </div>
    </div>
  );
}
