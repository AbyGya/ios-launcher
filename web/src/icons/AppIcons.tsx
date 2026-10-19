import type { ReactNode } from "react";
import type { AppId } from "../types";

const S = ({ children, vb = "0 0 100 100" }: { children: ReactNode; vb?: string }) => (
  <svg viewBox={vb} width="100%" height="100%" style={{ display: "block" }}>
    {children}
  </svg>
);

const Handset = () => (
  <S>
    <path
      fill="#fff"
      d="M27 16c2.5 0 4.6 1.7 5.2 4.1l2.6 10.4c.5 1.9-.1 3.9-1.5 5.2l-5.6 5.3c4.6 8.9 11.8 16.1 20.7 20.7l5.3-5.6c1.3-1.4 3.3-2 5.2-1.5l10.4 2.6c2.4.6 4.1 2.7 4.1 5.2V71c0 4.4-3.6 8-8 8C40.6 79 21 59.4 21 33.6c0-4.4 3.6-8 8-8h-2z"
    />
  </S>
);

const Bubble = () => (
  <S>
    <path
      fill="#fff"
      d="M50 18c19 0 34 11.6 34 26 0 14.4-15 26-34 26-3.4 0-6.7-.4-9.8-1.1-4.6 3.6-11 6.1-17.2 6.6-1 .1-1.4-1.2-.6-1.8 3.4-2.5 6.4-6 7.7-9.6C24.3 60 16 52.7 16 44c0-14.4 15-26 34-26z"
    />
  </S>
);

const Compass = () => (
  <S>
    <circle cx="50" cy="50" r="40" fill="url(#sfa)" />
    <defs>
      <linearGradient id="sfa" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#19b5fe" />
        <stop offset="1" stopColor="#0a5cff" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="34.5" fill="none" stroke="#fff" strokeWidth="2.6" />
    {Array.from({ length: 60 }).map((_, i) => {
      const a = (i / 60) * Math.PI * 2;
      const big = i % 5 === 0;
      const r1 = big ? 28.5 : 30;
      return (
        <line
          key={i}
          x1={50 + Math.cos(a) * r1}
          y1={50 + Math.sin(a) * r1}
          x2={50 + Math.cos(a) * 33.5}
          y2={50 + Math.sin(a) * 33.5}
          stroke="#fff"
          strokeWidth={big ? 1.7 : 0.8}
          opacity="0.95"
        />
      );
    })}
    <path d="M69 31 55.5 55.5 31 69 44.5 44.5z" fill="#ff3b30" />
    <path d="M69 31 55.5 55.5 44.5 44.5z" fill="#f5f5f5" />
    <path d="M31 69 44.5 44.5 55.5 55.5z" fill="#d8d8dc" />
    <circle cx="50" cy="50" r="2.6" fill="#fff" />
  </S>
);

const CameraGlyph = () => (
  <S>
    <rect x="12" y="30" width="76" height="52" rx="12" fill="#3a3a3c" />
    <rect x="12" y="30" width="76" height="52" rx="12" fill="none" stroke="#48484a" strokeWidth="1.5" />
    <rect x="30" y="22" width="20" height="12" rx="4" fill="#3a3a3c" />
    <circle cx="50" cy="56" r="17" fill="#1c1c1e" />
    <circle cx="50" cy="56" r="15" fill="none" stroke="#5a5a5e" strokeWidth="2" />
    <circle cx="50" cy="56" r="10" fill="#0b0b0d" />
    <circle cx="46" cy="52" r="3.4" fill="#3d6a94" opacity="0.8" />
    <circle cx="54" cy="60" r="1.8" fill="#89a7c4" opacity="0.7" />
    <circle cx="74" cy="40" r="3.4" fill="#ffd60a" />
  </S>
);

const Petals = () => {
  const hues = [348, 32, 52, 128, 200, 226, 268, 300, 324];
  const colors = ["#fb4d4d", "#ff9f0a", "#ffd60a", "#30d158", "#40c8e0", "#0a84ff", "#5e5ce6", "#bf5af2", "#ff375f"];
  return (
    <S>
      <rect width="100" height="100" fill="#fdfdfd" />
      {hues.map((_, i) => {
        const a = (i / 9) * Math.PI * 2 - Math.PI / 2;
        return (
          <ellipse
            key={i}
            cx={50 + Math.cos(a) * 14}
            cy={50 + Math.sin(a) * 14}
            rx="17"
            ry="9.4"
            fill={colors[i]}
            opacity="0.92"
            transform={`rotate(${(a * 180) / Math.PI} ${50 + Math.cos(a) * 14} ${50 + Math.sin(a) * 14})`}
          />
        );
      })}
      <circle cx="50" cy="50" r="75" fill="none" stroke="#fff" strokeWidth="0" />
    </S>
  );
};

const ClockFace = ({ dark }: { dark?: boolean }) => {
  const now = new Date();
  const h = (now.getHours() % 12) + now.getMinutes() / 60;
  const m = now.getMinutes();
  const s = now.getSeconds();
  const ha = (h / 12) * 360;
  const ma = (m / 60) * 360;
  const sa = (s / 60) * 360;
  const fg = dark ? "#fff" : "#111";
  return (
    <S>
      <rect width="100" height="100" fill={dark ? "#1c1c1e" : "#fff"} />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = ((i / 12) * 360 - 90) * (Math.PI / 180);
        return (
          <line
            key={i}
            x1={50 + Math.cos(a) * 36}
            y1={50 + Math.sin(a) * 36}
            x2={50 + Math.cos(a) * 42}
            y2={50 + Math.sin(a) * 42}
            stroke={fg}
            strokeWidth={i % 3 === 0 ? 4.4 : 2.4}
            strokeLinecap="round"
          />
        );
      })}
      <line x1="50" y1="50" x2={50 + Math.sin((ha * Math.PI) / 180) * 20} y2={50 - Math.cos((ha * Math.PI) / 180) * 20} stroke={fg} strokeWidth="5" strokeLinecap="round" />
      <line x1="50" y1="50" x2={50 + Math.sin((ma * Math.PI) / 180) * 30} y2={50 - Math.cos((ma * Math.PI) / 180) * 30} stroke={fg} strokeWidth="5" strokeLinecap="round" />
      <line x1="50" y1="50" x2={50 + Math.sin((sa * Math.PI) / 180) * 34} y2={50 - Math.cos((sa * Math.PI) / 180) * 34} stroke="#ff9f0a" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="50" cy="50" r="3.6" fill="#ff9f0a" />
      <circle cx="50" cy="50" r="2" fill={dark ? "#1c1c1e" : "#fff"} />
    </S>
  );
};

const CalcGlyph = () => {
  const btns: Array<[number, number, string]> = [
    [0, 0, "#8e8e93"], [1, 0, "#8e8e93"], [2, 0, "#8e8e93"],
    [0, 1, "#8e8e93"], [1, 1, "#8e8e93"], [2, 1, "#8e8e93"],
    [0, 2, "#8e8e93"], [1, 2, "#8e8e93"], [2, 2, "#8e8e93"],
    [0, 3, "#a5a5aa"], [1, 3, "#a5a5aa"],
  ];
  return (
    <S>
      <rect width="100" height="100" fill="#1c1c1e" />
      <rect x="14" y="14" width="72" height="18" rx="5" fill="#3a3a3c" />
      {btns.map(([x, y, c], i) => (
        <rect key={i} x={14 + x * 19.5} y={38 + y * 15.4} width="16" height="12.4" rx="4" fill={c} />
      ))}
      {[0, 1, 2, 3].map((y, i) => (
        <rect key={`o${y}`} x={14 + 3 * 19.5} y={38 + y * 15.4} width="16" height="12.4" rx="4" fill={i === 0 ? "#a5a5aa" : i === 3 ? "#ff9f0a" : "#ff9f0a"} />
      ))}
    </S>
  );
};

const Gear = () => (
  <S>
    <rect width="100" height="100" fill="url(#setg)" />
    <defs>
      <linearGradient id="setg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#b9b9c0" />
        <stop offset="1" stopColor="#7c7c84" />
      </linearGradient>
    </defs>
    <g fill="#4a4a50">
      {Array.from({ length: 8 }).map((_, i) => (
        <rect key={i} x="46" y="10" width="8" height="80" rx="3" transform={`rotate(${i * 45} 50 50)`} />
      ))}
      <circle cx="50" cy="50" r="30" />
    </g>
    <circle cx="50" cy="50" r="13" fill="#8a8a92" />
    <circle cx="50" cy="50" r="6" fill="#5a5a60" />
  </S>
);

const NotesGlyph = () => (
  <S>
    <rect width="100" height="100" fill="#fdfdfd" />
    <rect width="100" height="26" fill="#ffd60a" />
    <rect x="0" y="24" width="100" height="4" fill="#f5c800" opacity="0.6" />
    {[40, 54, 68].map((y) => (
      <rect key={y} x="16" y={y} width={y === 68 ? 40 : 68} height="4" rx="2" fill="#c7c7cc" />
    ))}
  </S>
);

const RemindersGlyph = () => {
  const cs = ["#ff453a", "#ff9f0a", "#30d158", "#0a84ff"];
  return (
    <S>
      <rect width="100" height="100" fill="#fdfdfd" />
      {cs.map((c, i) => (
        <g key={i}>
          <circle cx="24" cy={26 + i * 17} r="6.5" fill={c} />
          <rect x="38" y={22 + i * 17} width={i % 2 ? 40 : 46} height="7" rx="3.5" fill="#d1d1d6" />
        </g>
      ))}
    </S>
  );
};

const WeatherGlyph = () => (
  <S>
    <defs>
      <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#2f9bff" />
        <stop offset="1" stopColor="#0a5cff" />
      </linearGradient>
    </defs>
    <rect width="100" height="100" fill="url(#wg)" />
    <circle cx="62" cy="36" r="15" fill="#ffd60a" />
    {Array.from({ length: 8 }).map((_, i) => {
      const a = (i / 8) * Math.PI * 2;
      return (
        <line
          key={i}
          x1={62 + Math.cos(a) * 20}
          y1={36 + Math.sin(a) * 20}
          x2={62 + Math.cos(a) * 26}
          y2={36 + Math.sin(a) * 26}
          stroke="#ffd60a"
          strokeWidth="4"
          strokeLinecap="round"
        />
      );
    })}
    <path d="M30 66c-8 0-14-6-14-13 0-6.6 5-12 11.6-12.8C30 33.6 36 29 43 29c9.4 0 17 7.6 17 17v1h3c7.2 0 13 5.8 13 13s-5.8 13-13 13H30z" fill="#fff" opacity="0.96" />
  </S>
);

const MapsGlyph = () => (
  <S>
    <rect width="100" height="100" fill="#e9f4df" />
    <path d="M0 62C20 56 34 70 52 66 72 62 82 72 100 64V100H0z" fill="#a9d8f5" />
    <path d="M0 24 34 12V58L0 70z" fill="#cfe8c2" />
    <path d="M100 8 66 22v44l34-12z" fill="#d8ecc9" />
    <path d="M62 4c2.5 0 4.5 2 4.5 4.5 0 3.2-4.5 8.5-4.5 8.5s-4.5-5.3-4.5-8.5C57.5 6 59.5 4 62 4z" fill="#ff3b30" />
    <circle cx="62" cy="8.6" r="1.8" fill="#fff" />
    <path d="M28 10C40 22 42 44 44 58s14 20 24 24" stroke="#ffd60a" strokeWidth="6" fill="none" strokeLinecap="round" />
    <path d="M4 30C22 36 30 48 36 62" stroke="#fff" strokeWidth="5" fill="none" strokeLinecap="round" />
    <path d="M56 96C64 84 76 80 96 82" stroke="#fff" strokeWidth="5" fill="none" strokeLinecap="round" />
    <path d="M28 10C40 22 42 44 44 58s14 20 24 24" stroke="#f2b705" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6" />
  </S>
);

const CalendarGlyph = ({ light }: { light?: boolean }) => {
  const d = new Date();
  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  return (
    <S>
      <rect width="100" height="100" fill={light ? "#1c1c1e" : "#fff"} />
      <text x="50" y="26" textAnchor="middle" fontSize="17" fontWeight="600" fill="#ff3b30" letterSpacing="1">
        {days[d.getDay()]}
      </text>
      <text x="50" y="82" textAnchor="middle" fontSize="58" fontWeight="300" fill={light ? "#fff" : "#111"} fontFamily="Inter, sans-serif">
        {d.getDate()}
      </text>
    </S>
  );
};

const MailGlyph = () => (
  <S>
    <defs>
      <linearGradient id="mg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#20a3ff" />
        <stop offset="1" stopColor="#0a5cff" />
      </linearGradient>
    </defs>
    <rect width="100" height="100" fill="url(#mg)" />
    <rect x="14" y="28" width="72" height="46" rx="9" fill="#fff" />
    <path d="M16 34l34 24 34-24" fill="none" stroke="#0a5cff" strokeWidth="4.4" strokeLinecap="round" strokeLinejoin="round" />
  </S>
);

const FilesGlyph = () => (
  <S>
    <rect width="100" height="100" fill="#f2f2f4" />
    <path d="M14 30c0-3.3 2.7-6 6-6h18l7 8h35c3.3 0 6 2.7 6 6v32c0 3.3-2.7 6-6 6H20c-3.3 0-6-2.7-6-6V30z" fill="#3f9cff" />
    <path d="M14 36h72v34c0 3.3-2.7 6-6 6H20c-3.3 0-6-2.7-6-6V36z" fill="#78bbff" />
  </S>
);

const VoiceGlyph = () => {
  const hs = [10, 22, 16, 30, 20, 34, 26, 36, 24, 30, 18, 24, 12];
  return (
    <S>
      <rect width="100" height="100" fill="#101012" />
      {hs.map((h, i) => (
        <rect
          key={i}
          x={9 + i * 6.6}
          y={50 - h / 2}
          width="3.6"
          height={h}
          rx="1.8"
          fill={i % 3 === 1 ? "#ff453a" : "#ff6b5e"}
        />
      ))}
    </S>
  );
};

const WalletGlyph = () => (
  <S>
    <rect width="100" height="100" fill="#1c1c1e" />
    <rect x="22" y="16" width="56" height="36" rx="7" fill="#30d158" transform="rotate(-8 50 34)" />
    <rect x="20" y="28" width="60" height="38" rx="7" fill="#ff9f0a" transform="rotate(-3 50 47)" />
    <rect x="18" y="42" width="64" height="40" rx="8" fill="url(#wal)" />
    <defs>
      <linearGradient id="wal" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#5e5ce6" />
        <stop offset="1" stopColor="#0a84ff" />
      </linearGradient>
    </defs>
    <rect x="18" y="52" width="64" height="8" fill="#1c1c1e" opacity="0.25" />
    <circle cx="66" cy="70" r="6" fill="#fff" opacity="0.85" />
  </S>
);

const HealthGlyph = () => (
  <S>
    <rect width="100" height="100" fill="#fdfdfd" />
    <path
      d="M50 78C30 64 16 52 16 38.6 16 28 24 20 34.4 20c6 0 11.2 2.8 15.6 8.2C54.4 22.8 59.6 20 65.6 20 76 20 84 28 84 38.6 84 52 70 64 50 78z"
      fill="url(#hg)"
    />
    <defs>
      <linearGradient id="hg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#ff5f79" />
        <stop offset="1" stopColor="#ff2d55" />
      </linearGradient>
    </defs>
  </S>
);

const StoreGlyph = () => (
  <S>
    <defs>
      <linearGradient id="asg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#21b6ff" />
        <stop offset="1" stopColor="#0a5cff" />
      </linearGradient>
    </defs>
    <rect width="100" height="100" fill="url(#asg)" />
    <g stroke="#fff" strokeWidth="7" strokeLinecap="round" fill="none">
      <path d="M34 68 50 34l16 34" />
      <path d="M40 57h20" />
      <path d="M28 78h44" />
    </g>
  </S>
);

const FaceTimeGlyph = () => (
  <S>
    <rect width="100" height="100" fill="url(#ftg)" />
    <defs>
      <linearGradient id="ftg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#5be36b" />
        <stop offset="1" stopColor="#0fbf3f" />
      </linearGradient>
    </defs>
    <rect x="14" y="32" width="50" height="36" rx="10" fill="#fff" />
    <path d="M66 44l18-9v30l-18-9z" fill="#fff" />
  </S>
);

const MusicGlyph = () => (
  <S>
    <defs>
      <linearGradient id="mug" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fb5c74" />
        <stop offset="1" stopColor="#f5234e" />
      </linearGradient>
    </defs>
    <rect width="100" height="100" fill="url(#mug)" />
    <path d="M38 26l34-8v10l-34 8z" fill="#fff" />
    <rect x="66" y="18" width="6" height="42" rx="3" fill="#fff" />
    <rect x="32" y="30" width="6" height="42" rx="3" fill="#fff" />
    <ellipse cx="27" cy="74" rx="12" ry="9.6" fill="#fff" />
    <ellipse cx="61" cy="62" rx="12" ry="9.6" fill="#fff" />
  </S>
);

const PhoneGlyph = () => (
  <S>
    <defs>
      <linearGradient id="phg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#71e576" />
        <stop offset="1" stopColor="#1fb93e" />
      </linearGradient>
    </defs>
    <rect width="100" height="100" fill="url(#phg)" />
    <g transform="translate(0,0)"><Handset /></g>
  </S>
);

const MessagesGlyph = () => (
  <S>
    <defs>
      <linearGradient id="msg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#69f07c" />
        <stop offset="1" stopColor="#19c93d" />
      </linearGradient>
    </defs>
    <rect width="100" height="100" fill="url(#msg)" />
    <path
      fill="#fff"
      d="M50 22c17.1 0 31 10.5 31 23.5S67.1 69 50 69c-3 0-5.9-.3-8.6-.9-4.1 3.2-9.8 5.5-15.3 6-.9.1-1.3-1.1-.6-1.7 3-2.2 5.6-5.3 6.9-8.5C25.6 60.7 19 54 19 45.5 19 32.5 32.9 22 50 22z"
    />
  </S>
);

const SafariGlyph = () => (
  <S>
    <rect width="100" height="100" fill="#f4f4f6" />
    <circle cx="50" cy="50" r="41" fill="url(#safring)" />
    <defs>
      <linearGradient id="safring" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#1ea9f6" />
        <stop offset="1" stopColor="#0a5cff" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="34" fill="#fdfdfd" />
    {Array.from({ length: 60 }).map((_, i) => {
      const a = (i / 60) * Math.PI * 2;
      const big = i % 5 === 0;
      const r1 = big ? 28 : 29.6;
      return (
        <line key={i} x1={50 + Math.cos(a) * r1} y1={50 + Math.sin(a) * r1} x2={50 + Math.cos(a) * 33.4} y2={50 + Math.sin(a) * 33.4} stroke="#5a5a5e" strokeWidth={big ? 1.6 : 0.8} />
      );
    })}
    <path d="M70 30 56 56 30 70 44 44z" fill="#ff3b30" />
    <path d="M70 30 56 56 44 44z" fill="#f5f5f5" />
    <path d="M30 70 44 44 56 56z" fill="#c7c7cc" />
    <circle cx="50" cy="50" r="2.4" fill="#3a3a3c" />
  </S>
);

const FolderGlyph = () => (
  <S>
    <defs>
      <linearGradient id="fg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="rgba(255,255,255,0.85)" />
        <stop offset="1" stopColor="rgba(220,220,235,0.55)" />
      </linearGradient>
    </defs>
    <rect width="100" height="100" fill="url(#fg)" />
    {[
      [22, 26, "#ff9f0a"],
      [46, 22, "#30d158"],
      [62, 34, "#0a84ff"],
      [30, 52, "#ff375f"],
      [52, 50, "#bf5af2"],
      [24, 72, "#40c8e0"],
      [56, 70, "#ffd60a"],
    ].map(([x, y, c], i) => (
      <rect key={i} x={x as number} y={y as number} width="18" height="18" rx="4.6" fill={c as string} />
    ))}
  </S>
);

export function AppIconArt({ id, size = 60 }: { id: AppId | "utilities" | "folder"; size?: number }) {
  let art: ReactNode;
  switch (id) {
    case "phone": art = <PhoneGlyph />; break;
    case "messages": art = <MessagesGlyph />; break;
    case "safari": art = <SafariGlyph />; break;
    case "camera": art = <S> <rect width="100" height="100" fill="url(#camg)" /><defs><linearGradient id="camg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#636366" /><stop offset="1" stopColor="#3a3a3c" /></linearGradient></defs><g transform="scale(0.92) translate(4.3,4.3)"><CameraGlyph /></g></S>; break;
    case "photos": art = <Petals />; break;
    case "clock": art = <ClockFace dark />; break;
    case "calculator": art = <CalcGlyph />; break;
    case "settings": art = <Gear />; break;
    case "notes": art = <NotesGlyph />; break;
    case "reminders": art = <RemindersGlyph />; break;
    case "weather": art = <WeatherGlyph />; break;
    case "maps": art = <MapsGlyph />; break;
    case "calendar": art = <CalendarGlyph />; break;
    case "mail": art = <MailGlyph />; break;
    case "files": art = <FilesGlyph />; break;
    case "voicememos": art = <VoiceGlyph />; break;
    case "wallet": art = <WalletGlyph />; break;
    case "health": art = <HealthGlyph />; break;
    case "appstore": art = <StoreGlyph />; break;
    case "facetime": art = <FaceTimeGlyph />; break;
    case "music": art = <MusicGlyph />; break;
    default: art = <FolderGlyph />;
  }
  return (
    <div className="app-icon" style={{ width: size, height: size }}>
      {art}
    </div>
  );
}

export { Handset, Bubble, Compass, CameraGlyph, MusicGlyph, FaceTimeGlyph, MailGlyph, FolderGlyph, ClockFace };
