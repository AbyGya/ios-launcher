import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Sfx } from "../lib/sfx";
import { Haptics } from "../lib/haptics";

type Op = "+" | "−" | "×" | "÷";

const FMT = (n: number) => {
  if (!isFinite(n)) return "Error";
  const abs = Math.abs(n);
  if (abs >= 1e15 || (abs > 0 && abs < 1e-9)) return n.toExponential(6).replace("e", "e");
  const [int, dec] = String(Number(n.toPrecision(14))).split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return dec ? `${grouped}.${dec}` : grouped;
};

export default function CalculatorApp() {
  const [current, setCurrent] = useState("0");
  const [previous, setPrevious] = useState<number | null>(null);
  const [op, setOp] = useState<Op | null>(null);
  const [awaiting, setAwaiting] = useState(false);
  const [overwrite, setOverwrite] = useState(true);
  const [history, setHistory] = useState("");
  const [sci, setSci] = useState(false);
  const displayRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const numeric = parseFloat(current.replace(/,/g, "")) || 0;

  useLayoutEffect(() => {
    const el = displayRef.current;
    if (!el) return;
    const parent = el.parentElement!;
    const available = parent.clientWidth;
    let s = 1;
    el.style.transform = "scale(1)";
    const w = el.scrollWidth;
    if (w > available) s = Math.max(0.42, available / w);
    setScale(s);
  }, [current]);

  const commit = (a: number, b: number, o: Op): number => {
    switch (o) {
      case "+":
        return a + b;
      case "−":
        return a - b;
      case "×":
        return a * b;
      case "÷":
        return b === 0 ? NaN : a / b;
    }
  };

  const inputDigit = (d: string) => {
    Haptics.light();
    Sfx.tick();
    if (awaiting || overwrite) {
      setCurrent(d === "." ? "0." : d);
      setAwaiting(false);
      setOverwrite(false);
      return;
    }
    if (d === "." && current.includes(".")) return;
    if (current.replace(/[^0-9]/g, "").length >= 12) return;
    setCurrent(current === "0" && d !== "." ? d : current + d);
  };

  const applyOp = (o: Op) => {
    Haptics.medium();
    Sfx.click();
    const v = numeric;
    if (previous !== null && op && !awaiting) {
      const result = commit(previous, v, op);
      setHistory(`${FMT(previous)} ${op} ${FMT(v)} =`);
      setPrevious(result);
      setCurrent(FMT(result));
    } else {
      setPrevious(v);
    }
    setOp(o);
    setAwaiting(true);
    setOverwrite(true);
  };

  const equals = () => {
    Haptics.heavy();
    Sfx.click();
    if (previous === null || !op || awaiting) return;
    const result = commit(previous, numeric, op);
    setHistory(`${FMT(previous)} ${op} ${FMT(numeric)} =`);
    setCurrent(FMT(result));
    setPrevious(null);
    setOp(null);
    setAwaiting(false);
    setOverwrite(true);
  };

  const clearAll = () => {
    Haptics.medium();
    Sfx.tick();
    setCurrent("0");
    setPrevious(null);
    setOp(null);
    setAwaiting(false);
    setOverwrite(true);
    setHistory("");
  };

  const toggleSign = () => {
    Haptics.light();
    Sfx.tick();
    if (current.startsWith("-")) setCurrent(current.slice(1));
    else if (current !== "0") setCurrent(`-${current}`);
  };

  const percent = () => {
    Haptics.light();
    Sfx.tick();
    setCurrent(FMT((numeric / 100) || 0));
  };

  const backspace = () => {
    Haptics.light();
    Sfx.tick();
    if (overwrite) return;
    setCurrent((c) => (c.length <= 1 || (c.length === 2 && c.startsWith("-")) ? "0" : c.slice(0, -1)));
  };

  const unary = (fn: (x: number) => number, name: string) => {
    Haptics.light();
    Sfx.click();
    const r = fn(numeric);
    setHistory(`${name}(${FMT(numeric)})`);
    setCurrent(FMT(r));
    setOverwrite(true);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (/^[0-9]$/.test(e.key)) inputDigit(e.key);
      else if (e.key === ".") inputDigit(".");
      else if (e.key === "+") applyOp("+");
      else if (e.key === "-") applyOp("−");
      else if (e.key === "*") applyOp("×");
      else if (e.key === "/") {
        e.preventDefault();
        applyOp("÷");
      } else if (e.key === "Enter" || e.key === "=") equals();
      else if (e.key === "Escape") clearAll();
      else if (e.key === "Backspace") backspace();
      else if (e.key === "%") percent();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const btn = (
    label: string,
    opts: { color?: string; text?: string; wide?: boolean; active?: boolean; fn: () => void; small?: boolean },
  ) => (
    <button
      onClick={opts.fn}
      style={{
        gridColumn: opts.wide ? "span 2" : undefined,
        height: sci ? 62 : 78,
        borderRadius: 999,
        background: opts.active ? "#fff" : opts.color ?? "rgba(120,120,128,0.24)",
        color: opts.active ? "#ff9f0a" : opts.text ?? "inherit",
        fontSize: opts.small ? 24 : 32,
        fontWeight: 400,
        display: "flex",
        alignItems: "center",
        justifyContent: opts.wide ? "flex-start" : "center",
        paddingLeft: opts.wide ? 30 : 0,
        transition: "filter 0.12s ease",
      }}
      onPointerDown={(e) => (e.currentTarget.style.filter = "brightness(1.45)")}
      onPointerUp={(e) => (e.currentTarget.style.filter = "")}
      onPointerLeave={(e) => (e.currentTarget.style.filter = "")}
    >
      {label}
    </button>
  );

  return (
    <div style={{ position: "absolute", inset: 0, background: "var(--app-bg)", display: "flex", flexDirection: "column", paddingTop: 62 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 18px 0" }}>
        <button
          onClick={() => {
            Haptics.selection();
            Sfx.tick();
            setSci(!sci);
          }}
          style={{ fontSize: 13, color: sci ? "#ff9f0a" : "rgba(150,150,160,1)", fontWeight: 600 }}
        >
          {sci ? "Basic" : "Scientific"}
        </button>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "0 24px 14px", overflow: "hidden" }}>
        <div style={{ textAlign: "right", fontSize: 16, opacity: 0.45, minHeight: 22, fontVariantNumeric: "tabular-nums" }}>{history}</div>
        <div style={{ textAlign: "right", overflow: "hidden" }}>
          <div
            ref={displayRef}
            style={{
              fontSize: 76,
              fontWeight: 300,
              fontVariantNumeric: "tabular-nums",
              letterSpacing: -1.5,
              transform: `scale(${scale})`,
              transformOrigin: "right center",
              display: "inline-block",
              whiteSpace: "nowrap",
            }}
          >
            {current}
          </div>
        </div>
      </div>

      {sci && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, padding: "0 14px 10px" }}>
          {btn("√", { fn: () => unary((x) => Math.sqrt(Math.max(0, x)), "√"), small: true, color: "rgba(120,120,128,0.32)" })}
          {btn("x²", { fn: () => unary((x) => x * x, "x²"), small: true, color: "rgba(120,120,128,0.32)" })}
          {btn("xʸ", {
            fn: () => applyOp("×"),
            small: true,
            color: "rgba(120,120,128,0.32)",
          })}
          {btn("π", { fn: () => { setCurrent(FMT(Math.PI)); setOverwrite(true); Sfx.tick(); }, small: true, color: "rgba(120,120,128,0.32)" })}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: sci ? 10 : 14, padding: sci ? "0 14px 26px" : "0 18px 34px" }}>
        {btn("AC", { fn: clearAll, color: "rgba(120,120,128,0.38)" })}
        {btn("±", { fn: toggleSign, color: "rgba(120,120,128,0.38)" })}
        {btn("%", { fn: percent, color: "rgba(120,120,128,0.38)" })}
        {btn("÷", { fn: () => applyOp("÷"), color: "#ff9f0a", text: "#fff", active: op === "÷" && awaiting })}
        {btn("7", { fn: () => inputDigit("7") })}
        {btn("8", { fn: () => inputDigit("8") })}
        {btn("9", { fn: () => inputDigit("9") })}
        {btn("×", { fn: () => applyOp("×"), color: "#ff9f0a", text: "#fff", active: op === "×" && awaiting })}
        {btn("4", { fn: () => inputDigit("4") })}
        {btn("5", { fn: () => inputDigit("5") })}
        {btn("6", { fn: () => inputDigit("6") })}
        {btn("−", { fn: () => applyOp("−"), color: "#ff9f0a", text: "#fff", active: op === "−" && awaiting })}
        {btn("1", { fn: () => inputDigit("1") })}
        {btn("2", { fn: () => inputDigit("2") })}
        {btn("3", { fn: () => inputDigit("3") })}
        {btn("+", { fn: () => applyOp("+"), color: "#ff9f0a", text: "#fff", active: op === "+" && awaiting })}
        {btn("0", { fn: () => inputDigit("0"), wide: true })}
        {btn(".", { fn: () => inputDigit(".") })}
        {btn("=", { fn: equals, color: "#ff9f0a", text: "#fff" })}
      </div>
    </div>
  );
}
