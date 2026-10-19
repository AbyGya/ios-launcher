import { useEffect, useState } from "react";
import { useSettings } from "../store/settings";
import { useSystem } from "../store/system";
import { fmtClock } from "../lib/util";
import { BatteryIcon, SignalBars, Wifi } from "../icons/Sys";

export function useClock(intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function StatusBar({
  color = "auto",
  hideLeft,
}: {
  color?: "auto" | "light" | "dark";
  hideLeft?: boolean;
}) {
  const now = useClock(5000);
  const { wifi, cellular, airplane, batteryLevel, charging, focus } = useSystem();
  const lowPower = useSettings((s) => s.lowPower);
  const [realBattery, setRealBattery] = useState<{ level: number; charging: boolean } | null>(null);

  useEffect(() => {
    const nav = navigator as Navigator & {
      getBattery?: () => Promise<{ level: number; charging: boolean }>;
    };
    nav.getBattery?.().then((b) => {
      const update = () =>
        setRealBattery({ level: Math.round(b.level * 100), charging: b.charging });
      update();
      (b as unknown as EventTarget).addEventListener("levelchange", update);
      (b as unknown as EventTarget).addEventListener("chargingchange", update);
    });
  }, []);

  useEffect(() => {
    if (realBattery) {
      useSystem.setState({
        batteryLevel: realBattery.level,
        charging: realBattery.charging,
      });
    }
  }, [realBattery]);

  const c = color === "auto" ? "currentColor" : color === "light" ? "#fff" : "#000";

  return (
    <div className="statusbar" style={{ color: c }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, width: 120 }}>
        {!hideLeft && (
          <span style={{ fontVariantNumeric: "tabular-nums" }}>{fmtClock(now)}</span>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        {focus && <span style={{ fontSize: 12 }}>🌙</span>}
        {airplane ? (
          <span style={{ fontSize: 13 }}>✈︎</span>
        ) : (
          <>
            {cellular && <SignalBars strength={4} color={c} size={18} />}
            {wifi && <Wifi size={17} color={c} />}
          </>
        )}
        <BatteryIcon
          level={charging ? Math.min(100, batteryLevel + 5) : batteryLevel}
          charging={charging}
          color={lowPower ? "#ffd60a" : c}
        />
      </div>
    </div>
  );
}
