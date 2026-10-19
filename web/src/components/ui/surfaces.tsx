import {
  createContext,
  useContext,
  useEffect,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { create } from "zustand";
import { ChevronLeft, ChevronRight, Xmark } from "../../icons/Sys";
import { cn } from "../../lib/util";
import { Sfx } from "../../lib/sfx";
import { Haptics } from "../../lib/haptics";

interface AlertOpts {
  title: string;
  message?: string;
  buttons: string[];
  cancelIndex?: number;
}

interface AlertStore {
  current: (AlertOpts & { resolve: (i: number) => void }) | null;
  show: (o: AlertOpts) => Promise<number>;
}

const useAlertStore = create<AlertStore>((set) => ({
  current: null,
  show: (o) =>
    new Promise<number>((resolve) => {
      set({ current: { ...o, resolve } });
    }),
}));

export function showAlert(o: AlertOpts): Promise<number> {
  return useAlertStore.getState().show(o);
}

export function AlertHost() {
  const current = useAlertStore((s) => s.current);
  return (
    <AnimatePresence>
      {current && (
        <motion.div
          className="alert-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="alert-box"
            initial={{ scale: 1.16, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.08, opacity: 0, transition: { duration: 0.12 } }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
          >
            <div style={{ padding: "20px 18px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 17, fontWeight: 700 }}>{current.title}</div>
              {current.message && (
                <div style={{ fontSize: 13, marginTop: 6, opacity: 0.75, lineHeight: 1.4 }}>
                  {current.message}
                </div>
              )}
            </div>
            <div
              style={{
                display: current.buttons.length === 2 ? "flex" : "block",
                borderTop: "0.5px solid rgba(120,120,128,0.4)",
              }}
            >
              {current.buttons.map((b, i) => (
                <button
                  key={b}
                  onClick={() => {
                    Haptics.light();
                    current.resolve(i);
                    useAlertStore.setState({ current: null });
                  }}
                  style={{
                    flex: 1,
                    padding: "13px 10px",
                    fontSize: 17,
                    color: i === current.cancelIndex ? "#0a84ff" : i === 0 && current.buttons.length > 2 ? "#ff453a" : "#0a84ff",
                    fontWeight: i === current.cancelIndex ? 400 : 600,
                    borderLeft:
                      current.buttons.length === 2 && i === 1
                        ? "0.5px solid rgba(120,120,128,0.4)"
                        : undefined,
                    borderTop:
                      current.buttons.length > 2 && i > 0
                        ? "0.5px solid rgba(120,120,128,0.4)"
                        : undefined,
                    width: current.buttons.length > 2 ? "100%" : undefined,
                  }}
                >
                  {b}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Sheet({
  open,
  onClose,
  children,
  height,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  height?: number | string;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            style={{ height }}
          >
            <div style={{ width: "100%", padding: "10px 0 6px", display: "flex", justifyContent: "center" }}>
              <div style={{ width: 44, height: 5, borderRadius: 3, background: "rgba(150,150,155,0.5)" }} />
            </div>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function ListGroup({
  children,
  header,
  footer,
  style,
  inset = true,
}: {
  children: ReactNode;
  header?: string;
  footer?: string;
  style?: CSSProperties;
  inset?: boolean;
}) {
  return (
    <div style={style}>
      {header && (
        <div
          style={{
            fontSize: 13,
            textTransform: header === header.toUpperCase() ? undefined : "uppercase",
            opacity: 0.55,
            padding: inset ? "0 32px 7px" : "0 16px 7px",
            letterSpacing: header === header.toUpperCase() ? 0.6 : 0,
          }}
        >
          {header}
        </div>
      )}
      <div
        style={{
          borderRadius: 12,
          overflow: "hidden",
          background: "var(--card)",
          margin: inset ? "0 16px" : 0,
        }}
      >
        {children}
      </div>
      {footer && (
        <div style={{ fontSize: 13, opacity: 0.55, padding: "7px 32px 0", lineHeight: 1.35 }}>
          {footer}
        </div>
      )}
    </div>
  );
}

export function ListRow({
  icon,
  iconBg,
  label,
  value,
  chevron,
  onClick,
  right,
  sep,
  style,
  labelStyle,
  compact,
}: {
  icon?: ReactNode;
  iconBg?: string;
  label: ReactNode;
  value?: ReactNode;
  chevron?: boolean;
  onClick?: () => void;
  right?: ReactNode;
  sep?: boolean;
  style?: CSSProperties;
  labelStyle?: CSSProperties;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(sep && "list-sep")}
      onClick={() => {
        if (onClick) {
          Haptics.light();
          Sfx.tick();
          onClick();
        }
      }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: compact ? "9px 16px" : "11px 16px",
        minHeight: compact ? 40 : 44,
        background: "var(--card)",
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
    >
      {icon && (
        <div
          style={{
            width: 29,
            height: 29,
            borderRadius: 7,
            background: iconBg ?? "var(--blue)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
      )}
      <div style={{ flex: 1, fontSize: 17, ...labelStyle }}>{label}</div>
      {value !== undefined && (
        <div style={{ fontSize: 17, opacity: 0.5, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      )}
      {right}
      {chevron && (
        <div style={{ opacity: 0.32, marginRight: -6 }}>
          <ChevronRight size={16} color="currentColor" strokeWidth={2.4} />
        </div>
      )}
    </div>
  );
}

export function NavBar({
  title,
  large = true,
  onBack,
  right,
  transparent,
  style,
}: {
  title: string;
  large?: boolean;
  onBack?: () => void;
  right?: ReactNode;
  transparent?: boolean;
  style?: CSSProperties;
}) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const el = document.getElementById("app-scroll");
    if (!el) return;
    const onScroll = () => setScrolled(el.scrollTop > 8);
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div
      style={{
        paddingTop: 62,
        position: "sticky",
        top: 0,
        zIndex: 40,
        background: transparent
          ? "transparent"
          : scrolled
            ? "var(--nav-blur)"
            : "transparent",
        backdropFilter: scrolled && !transparent ? "blur(20px) saturate(180%)" : undefined,
        WebkitBackdropFilter: scrolled && !transparent ? "blur(20px) saturate(180%)" : undefined,
        transition: "background 0.25s ease",
        ...style,
      }}
    >
      <div
        style={{
          height: 44,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 8px",
        }}
      >
        <div style={{ width: 60 }}>
          {onBack && (
            <button
              onClick={() => {
                Haptics.light();
                Sfx.tick();
                onBack();
              }}
              style={{ display: "flex", alignItems: "center", color: "var(--blue)", gap: 2, fontSize: 17 }}
            >
              <ChevronLeft size={22} strokeWidth={2.2} />
            </button>
          )}
        </div>
        {!large && <div style={{ fontSize: 17, fontWeight: 600 }}>{title}</div>}
        <div style={{ display: "flex", gap: 14, justifyContent: "flex-end", minWidth: 60 }}>{right}</div>
      </div>
      {large && (
        <div style={{ padding: "2px 16px 10px", fontSize: 34, fontWeight: 700, letterSpacing: -0.4 }}>
          {title}
        </div>
      )}
    </div>
  );
}

export function PushView({
  children,
  onClose,
  bg = "var(--app-bg)",
}: {
  children: ReactNode;
  onClose: () => void;
  bg?: string;
}) {
  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", stiffness: 320, damping: 32 }}
      style={{
        position: "absolute",
        inset: 0,
        background: bg,
        zIndex: 60,
        display: "flex",
        flexDirection: "column",
      }}
      data-push
    >
      <div style={{ position: "absolute", top: 110, left: -60, zIndex: 100, opacity: 0 }} onPointerDown={onClose} />
      {children}
    </motion.div>
  );
}

export function TabBar({
  tabs,
  active,
  onChange,
  tint = "var(--blue)",
}: {
  tabs: { icon: ReactNode; label: string }[];
  active: number;
  onChange: (i: number) => void;
  tint?: string;
}) {
  return (
    <div className="tabbar glass">
      {tabs.map((t, i) => (
        <button
          key={t.label}
          onClick={() => {
            if (i === active) return;
            Haptics.selection();
            Sfx.tick();
            onChange(i);
          }}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 3,
            color: i === active ? tint : "rgba(150,150,160,1)",
            fontSize: 10.5,
            fontWeight: 500,
          }}
        >
          {t.icon}
          <span>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

export function ModalCloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 30,
        height: 30,
        borderRadius: "50%",
        background: "rgba(120,120,128,0.28)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Xmark size={15} color="rgba(160,160,170,1)" strokeWidth={2.4} />
    </button>
  );
}

export function AppThemeContext({ dark }: { dark: boolean }) {
  return useContext(AppTheme) ?? dark;
}

const AppTheme = createContext<boolean | null>(null);

export function AppThemeProvider({ dark, children }: { dark: boolean; children: ReactNode }) {
  return <AppTheme.Provider value={dark}>{children}</AppTheme.Provider>;
}

export function useAppTheme(): boolean {
  const v = useContext(AppTheme);
  if (v === null) return true;
  return v;
}
