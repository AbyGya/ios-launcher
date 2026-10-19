import { motion } from "framer-motion";

export function BootScreen() {
  return (
    <motion.div
      exit={{ opacity: 0, transition: { duration: 0.7, ease: "easeInOut" } }}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 400,
        background: "#000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 90,
      }}
    >
      <motion.svg
        viewBox="0 0 200 240"
        width={96}
        height={115}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
      >
        <motion.path
          d="M100 40c8-14 26-18 38-13-2 12-14 25-32 22M100 48c-30 0-54 24-54 62 0 40 30 74 54 74s54-34 54-74c0-38-24-62-54-62z"
          fill="#fff"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.4, ease: "easeInOut" }}
          stroke="#fff"
          strokeWidth="2"
        />
      </motion.svg>
      <div style={{ width: 240, height: 5, borderRadius: 3, background: "rgba(255,255,255,0.18)", overflow: "hidden" }}>
        <motion.div
          initial={{ width: "6%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 2.1, ease: [0.3, 0.6, 0.4, 1] }}
          style={{ height: "100%", borderRadius: 3, background: "#fff" }}
        />
      </div>
    </motion.div>
  );
}
