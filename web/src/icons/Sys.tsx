import type { CSSProperties } from "react";

interface P {
  size?: number;
  color?: string;
  style?: CSSProperties;
  strokeWidth?: number;
}

const G = ({
  children,
  size = 22,
  color = "currentColor",
  style,
  vb = "0 0 24 24",
}: P & { children: React.ReactNode; vb?: string }) => (
  <svg
    viewBox={vb}
    width={size}
    height={size}
    style={{ display: "block", flexShrink: 0, ...style }}
    fill="none"
    stroke={color}
    strokeWidth={1.9}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
);

export const Wifi = (p: P) => (
  <G {...p}>
    <path d="M2.5 8.8a15.5 15.5 0 0 1 19 0" />
    <path d="M5.6 12.5a10.5 10.5 0 0 1 12.8 0" />
    <path d="M8.8 16a5.6 5.6 0 0 1 6.4 0" />
    <circle cx="12" cy="19.2" r="1.15" fill={p.color ?? "currentColor"} stroke="none" />
  </G>
);

export const Airplane = (p: P) => (
  <G {...p}>
    <path d="M10.5 3.6c.4-1 2-1 2.4 0l1 5.7 6.9 2.6c.8.3.7 1.5-.2 1.6l-6.4.6-.7 5.3 2.4 1.6c.4.3.3 1-.3 1l-3-.4-3.1.4c-.5 0-.7-.7-.3-1l2.4-1.6-.7-5.3-6.4-.6c-.9-.1-1-1.3-.2-1.6l6.9-2.6z" />
  </G>
);

export const Bluetooth = (p: P) => (
  <G {...p}>
    <path d="M6.8 7.5 17 16.2l-5 4.3V3.5l5 4.3L6.8 16.5" />
  </G>
);

export const ChevronLeft = (p: P) => (
  <G {...p}>
    <path d="M14.8 5.5 8 12l6.8 6.5" />
  </G>
);

export const ChevronRight = (p: P) => (
  <G {...p}>
    <path d="M9.2 5.5 16 12l-6.8 6.5" />
  </G>
);

export const ChevronDown = (p: P) => (
  <G {...p}>
    <path d="M5.5 9.2 12 16l6.5-6.8" />
  </G>
);

export const ChevronUp = (p: P) => (
  <G {...p}>
    <path d="M5.5 14.8 12 8l6.5 6.8" />
  </G>
);

export const Magnifier = (p: P) => (
  <G {...p}>
    <circle cx="10.8" cy="10.8" r="6.3" />
    <path d="m15.6 15.6 4.4 4.4" />
  </G>
);

export const Xmark = (p: P) => (
  <G {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </G>
);

export const Plus = (p: P) => (
  <G {...p}>
    <path d="M12 5v14M5 12h14" />
  </G>
);

export const Minus = (p: P) => (
  <G {...p}>
    <path d="M5 12h14" />
  </G>
);

export const Ellipsis = (p: P) => (
  <G {...p}>
    <circle cx="5.2" cy="12" r="1.5" fill={p.color ?? "currentColor"} stroke="none" />
    <circle cx="12" cy="12" r="1.5" fill={p.color ?? "currentColor"} stroke="none" />
    <circle cx="18.8" cy="12" r="1.5" fill={p.color ?? "currentColor"} stroke="none" />
  </G>
);

export const LockIco = (p: P) => (
  <G {...p}>
    <rect x="5.5" y="10.5" width="13" height="9.5" rx="2.6" />
    <path d="M8.5 10.5V8a3.5 3.5 0 1 1 7 0v2.5" />
  </G>
);

export const Flashlight = (p: P) => (
  <G {...p}>
    <path d="M8.5 3.5h7l-.8 4.6c-.1.8.1 1.6.6 2.3l.6.9c.7 1 .4 2.4-.7 3h-6.4c-1.1-.6-1.4-2-.7-3l.6-.9c.5-.7.7-1.5.6-2.3z" />
    <path d="M10 14.5h4l-.4 5.2c-.1.7-.7 1.3-1.4 1.3h-.4c-.7 0-1.3-.6-1.4-1.3z" />
  </G>
);

export const Mic = (p: P) => (
  <G {...p}>
    <rect x="9.3" y="3" width="5.4" height="11" rx="2.7" />
    <path d="M5.8 11.5a6.2 6.2 0 0 0 12.4 0" />
    <path d="M12 17.7V21" />
  </G>
);

export const Stop = (p: P) => (
  <G {...p}>
    <rect x="6.5" y="6.5" width="11" height="11" rx="2.8" fill={p.color ?? "currentColor"} stroke="none" />
  </G>
);

export const Play = (p: P) => (
  <G {...p}>
    <path d="M8.5 5.8c0-1 1.1-1.6 1.9-1.1l8.4 5.7c.8.5.8 1.7 0 2.2l-8.4 5.7c-.8.5-1.9-.1-1.9-1.1z" fill={p.color ?? "currentColor"} stroke="none" />
  </G>
);

export const Pause = (p: P) => (
  <G {...p}>
    <rect x="7" y="5.5" width="3.4" height="13" rx="1.2" fill={p.color ?? "currentColor"} stroke="none" />
    <rect x="13.6" y="5.5" width="3.4" height="13" rx="1.2" fill={p.color ?? "currentColor"} stroke="none" />
  </G>
);

export const NextIco = (p: P) => (
  <G {...p}>
    <path d="M6.8 6.2c0-.9 1-1.4 1.7-1l7.6 5c.7.5.7 1.6 0 2.1l-7.6 5c-.7.4-1.7-.1-1.7-1z" fill={p.color ?? "currentColor"} stroke="none" />
    <rect x="17" y="5.3" width="2.4" height="13.4" rx="1.1" fill={p.color ?? "currentColor"} stroke="none" />
  </G>
);

export const PrevIco = (p: P) => (
  <G {...p}>
    <path d="M17.2 6.2c0-.9-1-1.4-1.7-1l-7.6 5c-.7.5-.7 1.6 0 2.1l7.6 5c.7.4 1.7-.1 1.7-1z" fill={p.color ?? "currentColor"} stroke="none" />
    <rect x="4.6" y="5.3" width="2.4" height="13.4" rx="1.1" fill={p.color ?? "currentColor"} stroke="none" />
  </G>
);

export const Shuffle = (p: P) => (
  <G {...p}>
    <path d="M3 7h3.5c1.2 0 2.3.6 3 1.6l5 7c.7 1 1.8 1.6 3 1.6H21" />
    <path d="M18 14.8 21 17.2 18 19.6" />
    <path d="M3 17.2h3.5c1.2 0 2.3-.6 3-1.6l1-1.4" />
    <path d="M15 8.9l.5-.7c.7-1 1.8-1.6 3-1.6H21" />
    <path d="M18 3.8 21 6.2 18 8.6" />
  </G>
);

export const Repeat = (p: P) => (
  <G {...p}>
    <path d="M17 3.8 20.2 7 17 10.2" />
    <path d="M3.8 12V9c0-1.2 1-2 2.2-2h14" />
    <path d="M7 20.2 3.8 17 7 13.8" />
    <path d="M20.2 12v3c0 1.2-1 2-2.2 2h-14" />
  </G>
);

export const Airplay = (p: P) => (
  <G {...p}>
    <path d="M6.5 16.5H5a1.6 1.6 0 0 1-1.6-1.6V5.6C3.4 4.7 4.1 4 5 4h14c.9 0 1.6.7 1.6 1.6v9.3a1.6 1.6 0 0 1-1.6 1.6h-1.5" />
    <path d="M12 14.2 16 20H8z" fill={p.color ?? "currentColor"} stroke="none" />
  </G>
);

export const VolumeLow = (p: P) => (
  <G {...p}>
    <path d="M4 9.5h3l4-3.6v12.2l-4-3.6H4z" fill={p.color ?? "currentColor"} stroke="none" />
    <path d="M14.5 9.4a3.8 3.8 0 0 1 0 5.2" />
  </G>
);

export const VolumeHigh = (p: P) => (
  <G {...p}>
    <path d="M3 9.5h3l4-3.6v12.2l-4-3.6H3z" fill={p.color ?? "currentColor"} stroke="none" />
    <path d="M13.3 9.4a3.8 3.8 0 0 1 0 5.2M16 6.8a7.6 7.6 0 0 1 0 10.4" />
  </G>
);

export const Sun = (p: P) => (
  <G {...p}>
    <circle cx="12" cy="12" r="4.4" />
    <path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7" />
  </G>
);

export const Moon = (p: P) => (
  <G {...p}>
    <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" />
  </G>
);

export const GridIco = (p: P) => (
  <G {...p}>
    <rect x="4" y="4" width="7" height="7" rx="2.2" />
    <rect x="13" y="4" width="7" height="7" rx="2.2" />
    <rect x="4" y="13" width="7" height="7" rx="2.2" />
    <rect x="13" y="13" width="7" height="7" rx="2.2" />
  </G>
);

export const Trash = (p: P) => (
  <G {...p}>
    <path d="M4.5 6.5h15M9.5 6V4.4c0-.5.4-.9.9-.9h3.2c.5 0 .9.4.9.9V6" />
    <path d="M6.5 6.5 7.3 19c.1.8.7 1.4 1.5 1.4h6.4c.8 0 1.4-.6 1.5-1.4l.8-12.5" />
    <path d="M10.2 10.5v6M13.8 10.5v6" />
  </G>
);

export const Share = (p: P) => (
  <G {...p}>
    <path d="M12 3.5v11" />
    <path d="M8.5 6.5 12 3l3.5 3.5" />
    <path d="M6.5 10.5h-1A1.5 1.5 0 0 0 4 12v7a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 19v-7a1.5 1.5 0 0 0-1.5-1.5h-1" />
  </G>
);

export const Bookmark = (p: P) => (
  <G {...p}>
    <path d="M6.5 3.8h11c.6 0 1 .4 1 1v15.4l-6.5-4-6.5 4V4.8c0-.6.4-1 1-1z" />
  </G>
);

export const Rotate = (p: P) => (
  <G {...p}>
    <path d="M20 8.5V4.8M16.3 4.8h3.7" />
    <path d="M19.6 8.2A8 8 0 1 0 20 12" />
  </G>
);

export const Sliders = (p: P) => (
  <G {...p}>
    <path d="M5 7h14M5 12h14M5 17h14" />
    <circle cx="9" cy="7" r="1.9" fill="#141416" />
    <circle cx="15" cy="12" r="1.9" fill="#141416" />
    <circle cx="7.5" cy="17" r="1.9" fill="#141416" />
  </G>
);

export const LocationArrow = (p: P) => (
  <G {...p}>
    <path d="M20 4 4.8 11.2c-.7.3-.7 1.3 0 1.6l6.2 2.2 2.2 6.2c.3.7 1.3.7 1.6 0z" fill={p.color ?? "currentColor"} stroke="none" />
  </G>
);

export const Check = (p: P) => (
  <G {...p}>
    <path d="M4.5 12.5 9.5 17.5 19.5 6.5" strokeWidth={2.4} />
  </G>
);

export const CheckCircle = (p: P) => (
  <G {...p}>
    <circle cx="12" cy="12" r="8.8" />
    <path d="M8.2 12.3l2.7 2.7 5-5.4" />
  </G>
);

export const BellIco = (p: P) => (
  <G {...p}>
    <path d="M12 3.2c3.6 0 6 2.7 6 6.2v3.3l1.3 2.6c.3.6-.1 1.3-.8 1.3H5.5c-.7 0-1.1-.7-.8-1.3L6 12.7V9.4c0-3.5 2.4-6.2 6-6.2z" />
    <path d="M10 19.6a2.1 2.1 0 0 0 4 0" />
  </G>
);

export const TimerIco = (p: P) => (
  <G {...p}>
    <circle cx="12" cy="13.5" r="7.3" />
    <path d="M12 10.2v3.4l2.2 1.6" />
    <path d="M9.8 3.4h4.4" />
  </G>
);

export const CalendarIco = (p: P) => (
  <G {...p}>
    <rect x="3.2" y="5" width="17.6" height="16" rx="3.4" />
    <path d="M3.2 10.2h17.6M8.2 3v4M15.8 3v4" />
  </G>
);

export const MailIco = (p: P) => (
  <G {...p}>
    <rect x="2.8" y="5.4" width="18.4" height="13.2" rx="3.2" />
    <path d="m4.4 7.6 6.3 5a2 2 0 0 0 2.6 0l6.3-5" />
  </G>
);

export const SendIco = (p: P) => (
  <G {...p}>
    <path d="M20.4 3.6 3.4 10.2l7 2.6 2.6 7z" />
    <path d="m20.4 3.6-10 9.2" />
  </G>
);

export const WorldIco = (p: P) => (
  <G {...p}>
    <circle cx="12" cy="12" r="8.8" />
    <path d="M3.4 12h17.2M12 3.2c2.4 2.4 3.6 5.4 3.6 8.8s-1.2 6.4-3.6 8.8c-2.4-2.4-3.6-5.4-3.6-8.8S9.6 5.6 12 3.2z" />
  </G>
);

export const Keyboard = (p: P) => (
  <G {...p}>
    <rect x="3" y="6.5" width="18" height="11" rx="2.2" />
    <path d="M6.5 10h.01M9.5 10h.01M12.5 10h.01M15.5 10h.01M18 10h.01M6.5 13.5h.01M18 13.5h.01M9 13.5h6" />
  </G>
);

export const PhoneDown = (p: P) => (
  <G {...p}>
    <path d="M3.2 13.6c4.6-4.4 13-4.4 17.6 0 .5.5.6 1.3.1 1.8l-1.9 2c-.5.5-1.2.5-1.7.1l-2.6-2c-.5-.4-.6-1-.4-1.5l.4-1c-2.8-1.2-6-1.2-8.8 0l.4 1c.2.6.1 1.2-.4 1.5l-2.6 2c-.5.4-1.3.4-1.7-.1l-1.9-2a1.3 1.3 0 0 1 0-1.8z" fill={p.color ?? "currentColor"} stroke="none" />
  </G>
);

export const VideoCam = (p: P) => (
  <G {...p}>
    <rect x="3" y="6.5" width="12.5" height="11" rx="3" />
    <path d="M15.5 10.6 21 7.5v9l-5.5-3.1z" />
  </G>
);

export const HeartIco = (p: P) => (
  <G {...p}>
    <path d="M12 20C6.4 16 3.5 12.9 3.5 9.4 3.5 6.8 5.5 5 8 5c1.6 0 3 .8 4 2.2C13 5.8 14.4 5 16 5c2.5 0 4.5 1.8 4.5 4.4 0 3.5-2.9 6.6-8.5 10.6z" />
  </G>
);

export const Star = (p: P) => (
  <G {...p}>
    <path d="m12 3.6 2.5 5.2 5.7.8-4.1 4 1 5.7-5.1-2.7-5.1 2.7 1-5.7-4.1-4 5.7-.8z" />
  </G>
);

export const Person = (p: P) => (
  <G {...p}>
    <circle cx="12" cy="8.2" r="3.9" />
    <path d="M4.6 20.2c1-3.4 4-5.4 7.4-5.4s6.4 2 7.4 5.4" />
  </G>
);

export const PencilIco = (p: P) => (
  <G {...p}>
    <path d="m14.5 5 4.5 4.5L9 19.5H4.5V15z" />
    <path d="m12.5 7 4.5 4.5" />
  </G>
);

export const ListIco = (p: P) => (
  <G {...p}>
    <path d="M8.5 6.5h11M8.5 12h11M8.5 17.5h11" />
    <circle cx="4.8" cy="6.5" r="1.3" fill={p.color ?? "currentColor"} stroke="none" />
    <circle cx="4.8" cy="12" r="1.3" fill={p.color ?? "currentColor"} stroke="none" />
    <circle cx="4.8" cy="17.5" r="1.3" fill={p.color ?? "currentColor"} stroke="none" />
  </G>
);

export const GearIco = (p: P) => (
  <G {...p}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M12 3.4 13.4 6a6.4 6.4 0 0 1 2.2.9l2.8-.9 1.6 2.8-2 2.1a6.6 6.6 0 0 1 0 2.4l2 2.1-1.6 2.8-2.8-.9a6.4 6.4 0 0 1-2.2.9L12 20.6 10.6 18a6.4 6.4 0 0 1-2.2-.9l-2.8.9-1.6-2.8 2-2.1a6.6 6.6 0 0 1 0-2.4l-2-2.1 1.6-2.8 2.8.9A6.4 6.4 0 0 1 10.6 6z" />
  </G>
);

export const Eye = (p: P) => (
  <G {...p}>
    <path d="M3 12s3.4-6 9-6 9 6 9 6-3.4 6-9 6-9-6-9-6z" />
    <circle cx="12" cy="12" r="2.7" />
  </G>
);

export const FaceIDIco = (p: P) => (
  <G {...p}>
    <path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" />
    <path d="M9.3 9.4v2.4M14.7 9.4v2.4M12 9.4v4.2h-.8" />
    <path d="M9 16.3c1.6 1.4 4.4 1.4 6 0" />
  </G>
);

export const LocationPin = (p: P) => (
  <G {...p}>
    <path d="M12 21c-4-3.8-6.5-7.4-6.5-10.4a6.5 6.5 0 0 1 13 0c0 3-2.5 6.6-6.5 10.4z" />
    <circle cx="12" cy="10.4" r="2.4" />
  </G>
);

export const PhoneIco = (p: P) => (
  <G {...p}>
    <path d="M6.8 3.8c.6 0 1.1.4 1.3 1l.7 2.7c.1.5 0 1-.4 1.3l-1.4 1.3a11.5 11.5 0 0 0 5.2 5.2l1.3-1.4c.3-.3.8-.5 1.3-.4l2.7.7c.6.2 1 .7 1 1.3v2.7c0 .8-.6 1.4-1.4 1.4C10.9 19.6 4.4 13.1 4.4 5.2c0-.8.6-1.4 1.4-1.4z" />
  </G>
);

export const MessageIco = (p: P) => (
  <G {...p}>
    <path d="M12 4.2c4.7 0 8.5 3 8.5 6.7s-3.8 6.7-8.5 6.7c-.9 0-1.8-.1-2.6-.3-1.3 1-3 1.7-4.6 1.9-.5.1-.7-.6-.3-.9.9-.7 1.7-1.7 2-2.6-1.9-1.2-3-3-3-4.8 0-3.7 3.8-6.7 8.5-6.7z" />
  </G>
);

export const BatteryIcon = ({
  level,
  charging,
  color = "currentColor",
  size = 28,
}: {
  level: number;
  charging?: boolean;
  color?: string;
  size?: number;
}) => (
  <svg viewBox="0 0 34 16" width={size} height={size * 0.47} style={{ display: "block" }}>
    <rect x="0.8" y="1" width="27" height="14" rx="4.4" fill="none" stroke={color} strokeOpacity="0.42" strokeWidth="1.1" />
    <rect x="2.4" y="2.6" width="23.8" height="10.8" rx="3" fill="none" stroke="none" />
    <rect
      x="2.4"
      y="2.6"
      width={Math.max(2.4, (23.8 * Math.min(100, Math.max(0, level))) / 100)}
      height="10.8"
      rx="3"
      fill={level <= 20 ? "#ff453a" : color}
    />
    <path d="M29.6 5.4v5.2c1.6-.4 2.6-1.3 2.6-2.6s-1-2.2-2.6-2.6z" fill={color} fillOpacity="0.42" />
    {charging && (
      <path d="M15.6 2.6 10.4 8.6h3.6l-1.6 4.8 5.2-6h-3.6z" fill="#0b0b0d" stroke="#fff" strokeWidth="0.6" />
    )}
  </svg>
);

export const SignalBars = ({ strength = 4, color = "currentColor", size = 20 }: { strength?: number; color?: string; size?: number }) => (
  <svg viewBox="0 0 20 14" width={size} height={size * 0.7} style={{ display: "block" }}>
    {[0, 1, 2, 3].map((i) => (
      <rect
        key={i}
        x={i * 5}
        y={11 - (i + 1) * 2.6}
        width="3.4"
        height={(i + 1) * 2.6 + 1}
        rx="1"
        fill={color}
        opacity={i < strength ? 1 : 0.28}
      />
    ))}
  </svg>
);

export const CameraGlyph = (p: P) => (
  <G {...p}>
    <rect x="3" y="6.5" width="18" height="13.5" rx="3.4" />
    <path d="M8.6 6.5 10 4.4h4l1.4 2.1" />
    <circle cx="12" cy="13" r="3.6" />
  </G>
);

export const PhotoIco = (p: P) => (
  <G {...p}>
    <rect x="3" y="4.5" width="18" height="15" rx="3.2" />
    <circle cx="8.6" cy="9.6" r="1.8" />
    <path d="m5 18 5.2-5.2 3 3 3.2-3.2L21 16.2" />
  </G>
);

export const SparklesIco = (p: P) => (
  <G {...p}>
    <path d="M12 3.5 13.8 9l5.5 1.8-5.5 1.8L12 18l-1.8-5.4L4.7 10.8 10.2 9z" />
    <path d="M19 15.5l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9z" />
  </G>
);

export const FolderIco = (p: P) => (
  <G {...p}>
    <path d="M3.5 7.2c0-1 .8-1.9 1.9-1.9h3.8l1.8 2.1h7.6c1 0 1.9.8 1.9 1.9v7.4c0 1-.8 1.9-1.9 1.9H5.4c-1 0-1.9-.8-1.9-1.9z" />
  </G>
);

export const MusicNoteIco = (p: P) => (
  <G {...p}>
    <path d="M9 17.5V6.2l9-2v11.1" />
    <ellipse cx="6.6" cy="17.5" rx="2.4" ry="1.9" />
    <ellipse cx="15.6" cy="15.3" rx="2.4" ry="1.9" />
  </G>
);

export const DiscIco = (p: P) => (
  <G {...p}>
    <circle cx="12" cy="12" r="8.6" />
    <circle cx="12" cy="12" r="2.3" />
    <path d="M18.2 7.4 13.9 10.6M5.8 16.6l4.3-3.2" />
  </G>
);

export const SiriOrb = ({ size = 46 }: { size?: number }) => (
  <svg viewBox="0 0 100 100" width={size} height={size}>
    <defs>
      <radialGradient id="siri1" cx="0.35" cy="0.3" r="0.9">
        <stop offset="0" stopColor="#8ad4ff" />
        <stop offset="0.5" stopColor="#5e5ce6" />
        <stop offset="1" stopColor="#ff375f" />
      </radialGradient>
      <radialGradient id="siri2" cx="0.7" cy="0.7" r="0.8">
        <stop offset="0" stopColor="#ffd60a" stopOpacity="0.9" />
        <stop offset="0.6" stopColor="#ff375f" stopOpacity="0.5" />
        <stop offset="1" stopColor="#bf5af2" stopOpacity="0" />
      </radialGradient>
    </defs>
    <circle cx="50" cy="50" r="42" fill="url(#siri1)" />
    <circle cx="50" cy="50" r="42" fill="url(#siri2)" />
  </svg>
);
