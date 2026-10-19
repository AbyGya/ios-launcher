import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { motion } from "framer-motion";
import { Sfx } from "../../lib/sfx";
import { Haptics } from "../../lib/haptics";
import { clamp, cn } from "../../lib/util";
import { Magnifier, Xmark } from "../../icons/Sys";

export function Switch({
  checked,
  onChange,
  color = "#30d158",
}: {
  checked: boolean;
  onChange?: (v: boolean) => void;
  color?: string;
}) {
  return (
    <button
      className="ios-switch"
      onClick={(e) => {
        e.stopPropagation();
        Haptics.light();
        Sfx.tick();
        onChange?.(!checked);
      }}
      style={{ background: checked ? color : "rgba(120,120,128,0.32)" }}
      aria-checked={checked}
      role="switch"
    >
      <span
        className="ios-switch-knob"
        style={{
          transform: checked ? "translateX(20px)" : "translateX(0)",
          transition: "transform 0.28s cubic-bezier(0.3, 1.4, 0.5, 1)",
        }}
      />
    </button>
  );
}

export function Slider({
  value,
  onChange,
  vertical = false,
  length = 260,
  thickness = 64,
  icon,
  iconSize = 24,
  onEnd,
}: {
  value: number;
  onChange: (v: number) => void;
  vertical?: boolean;
  length?: number;
  thickness?: number;
  icon?: ReactNode;
  iconSize?: number;
  onEnd?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const handle = useCallback(
    (clientX: number, clientY: number) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const v = vertical
        ? 1 - clamp((clientY - r.top) / r.height, 0, 1)
        : clamp((clientX - r.left) / r.width, 0, 1);
      onChange(v);
    },
    [onChange, vertical],
  );

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (dragging.current) handle(e.clientX, e.clientY);
    };
    const up = () => {
      if (dragging.current) {
        dragging.current = false;
        onEnd?.();
      }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [handle, onEnd]);

  const pct = clamp(value, 0, 1) * 100;

  return (
    <div
      ref={ref}
      className="ios-slider glass"
      onPointerDown={(e) => {
        dragging.current = true;
        handle(e.clientX, e.clientY);
      }}
      style={{
        width: vertical ? thickness : length,
        height: vertical ? length : thickness,
        borderRadius: 999,
        touchAction: "none",
      }}
    >
      <div
        className="ios-slider-fill"
        style={
          vertical
            ? { left: 0, right: 0, top: `${100 - pct}%`, height: `${pct}%`, background: "#fff" }
            : { top: 0, bottom: 0, left: 0, width: `${pct}%`, background: "#fff" }
        }
      />
      {icon && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: vertical ? "flex-end" : "flex-start",
            justifyContent: vertical ? "center" : "flex-end",
            padding: 14,
            pointerEvents: "none",
            color: pct > (vertical ? 22 : 78) ? "#111" : "#fff",
            mixBlendMode: "difference",
          }}
        >
          <div style={{ width: iconSize, height: iconSize }}>{icon}</div>
        </div>
      )}
    </div>
  );
}

export function Segmented({
  options,
  value,
  onChange,
  style,
}: {
  options: string[];
  value: number;
  onChange: (i: number) => void;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setW(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const each = w > 0 ? (w - 4) / options.length : 0;
  return (
    <div
      ref={ref}
      className="segmented"
      style={{
        background: "rgba(120,120,128,0.2)",
        ...style,
      }}
    >
      {each > 0 && (
        <div
          className="segmented-thumb"
          style={{
            width: each,
            transform: `translateX(${value * each}px)`,
            transition: "transform 0.28s cubic-bezier(0.3, 1.2, 0.4, 1)",
            background: "rgba(130,130,135,0.4)",
            left: 2,
          }}
        />
      )}
      {options.map((o, i) => (
        <button
          key={o}
          onClick={() => {
            Haptics.selection();
            Sfx.tick();
            onChange(i);
          }}
          style={{
            flex: 1,
            position: "relative",
            zIndex: 1,
            padding: "6px 12px",
            fontWeight: value === i ? 700 : 500,
          }}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

const ITEM_H = 40;

export function WheelPicker({
  values,
  value,
  onChange,
  width = 200,
  textSize = 23,
  loop = true,
}: {
  values: number[];
  value: number;
  onChange: (v: number) => void;
  width?: number;
  textSize?: number;
  loop?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [scroll, setScroll] = useState(0);
  const visible = 5;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const idx = values.indexOf(value);
    el.scrollTop = idx * ITEM_H;
    setScroll(idx * ITEM_H);
  }, [values, value]);

  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    setScroll(el.scrollTop);
  };

  const settle = () => {
    const el = ref.current;
    if (!el) return;
    const idx = Math.round(el.scrollTop / ITEM_H);
    const clamped = clamp(idx, 0, values.length - 1);
    el.scrollTo({ top: clamped * ITEM_H, behavior: "smooth" });
    if (values[clamped] !== value) {
      Haptics.selection();
      Sfx.tick();
      onChange(values[clamped]);
    }
  };

  return (
    <div
      style={{
        position: "relative",
        width,
        height: ITEM_H * visible,
        overflow: "hidden",
        maskImage:
          "linear-gradient(transparent, #000 26%, #000 74%, transparent)",
        WebkitMaskImage:
          "linear-gradient(transparent, #000 26%, #000 74%, transparent)",
      }}
    >
      <div
        ref={ref}
        className="scroll-y"
        onScroll={onScroll}
        onPointerUp={settle}
        onScrollEnd={settle as unknown as () => void}
        style={{
          height: "100%",
          paddingTop: ITEM_H * Math.floor(visible / 2),
          paddingBottom: ITEM_H * Math.floor(visible / 2),
          perspective: 900,
          scrollSnapType: "y mandatory",
        }}
      >
        {values.map((v, i) => {
          const offset = i * ITEM_H - scroll;
          const dist = Math.abs(offset) / ITEM_H;
          const rot = clamp(offset / ITEM_H, -2.2, 2.2) * 22;
          return (
            <div
              key={v}
              style={{
                height: ITEM_H,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: textSize,
                fontWeight: 600,
                transform: `rotateX(${rot}deg) scale(${1 - dist * 0.08})`,
                opacity: 1 - dist * 0.24,
                scrollSnapAlign: "center",
                fontVariantNumeric: "tabular-nums",
                transition: "transform 0.08s linear",
              }}
              onClick={() => {
                const el = ref.current;
                el?.scrollTo({ top: i * ITEM_H, behavior: "smooth" });
                Haptics.selection();
                Sfx.tick();
                onChange(v);
              }}
            >
              {String(v).padStart(2, "0")}
            </div>
          );
        })}
      </div>
      <div
        style={{
          position: "absolute",
          top: ITEM_H * Math.floor(visible / 2),
          left: 0,
          right: 0,
          height: ITEM_H,
          borderRadius: 10,
          background: "rgba(120,120,128,0.16)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

export function SearchBar({
  value,
  onChange,
  placeholder,
  onCancel,
  autoFocus,
  style,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  onCancel?: () => void;
  autoFocus?: boolean;
  style?: CSSProperties;
}) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, ...style }}>
      <div
        className="glass"
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          gap: 7,
          height: 38,
          borderRadius: 12,
          padding: "0 10px",
        }}
      >
        <Magnifier size={17} color="rgba(140,140,150,1)" />
        <input
          value={value}
          autoFocus={autoFocus}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          placeholder={placeholder}
          style={{ flex: 1, fontSize: 17, color: "inherit" }}
        />
        {value && (
          <button
            onClick={() => onChange("")}
            style={{
              width: 19,
              height: 19,
              borderRadius: "50%",
              background: "rgba(140,140,150,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Xmark size={11} color="#fff" strokeWidth={2.6} />
          </button>
        )}
      </div>
      {onCancel && (focus || value) && (
        <button
          onClick={() => {
            onChange("");
            onCancel();
          }}
          style={{ fontSize: 17, color: "var(--blue)" }}
        >
          Batal
        </button>
      )}
    </div>
  );
}

export function GlassButton({
  children,
  onClick,
  active,
  style,
  size = 56,
}: {
  children: ReactNode;
  onClick?: () => void;
  active?: boolean;
  style?: CSSProperties;
  size?: number;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={() => {
        Haptics.light();
        Sfx.tick();
        onClick?.();
      }}
      className={cn("glass", active && "glass-strong")}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: active ? "rgba(255,255,255,0.92)" : undefined,
        color: active ? "#111" : "#fff",
        ...style,
      }}
    >
      {children}
    </motion.button>
  );
}
