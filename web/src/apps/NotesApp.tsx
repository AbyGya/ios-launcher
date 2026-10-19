import { useState } from "react";
import { motion } from "framer-motion";
import { useT, translate } from "../i18n";
import { useSettings } from "../store/settings";
import { useLocalState } from "../lib/useLocalState";
import { Sfx } from "../lib/sfx";
import { Haptics } from "../lib/haptics";
import { pad2 } from "../lib/util";
import { NavBar, PushView, showAlert } from "../components/ui/surfaces";
import { SearchBar } from "../components/ui/controls";
import { ChevronLeft, ChevronRight, FolderIco, PencilIco, Plus, Trash } from "../icons/Sys";

interface Note {
  id: string;
  title: string;
  body: string;
  ts: number;
  folder: string;
}

const FOLDERS = [
  { id: "general", key: "notes.folderGeneral" },
  { id: "work", key: "notes.folderWork" },
  { id: "personal", key: "notes.folderPersonal" },
];

const DEFAULT_NOTES: Note[] = [
  {
    id: "n1",
    folder: "general",
    title: "Resep Kopi Susu Gula Aren",
    body: "Bahan:\n• Espresso 30 ml\n• Susu segar 150 ml\n• Gula aren cair 25 ml\n• Es batu secukupnya\n\nCara buat:\n1. Tuang gula aren ke dasar gelas\n2. Tambahkan es batu\n3. Tuang susu dingin perlahan\n4. Terakhir tuang espresso",
    ts: Date.now() - 3600_000,
  },
  {
    id: "n2",
    folder: "general",
    title: "Ide Konten Desember",
    body: "• Behind the scenes foto produk\n• Tips rayakan akhir tahun hemat\n• Rekap fitur baru v2.3\n• Kolaborasi dengan komunitas lokal",
    ts: Date.now() - 86400_000,
  },
  {
    id: "n3",
    folder: "personal",
    title: "Daftar Belanja Mingguan",
    body: "Beras 5 kg\nMinyak goreng\nTelur 1 tray\nSayur hijau\nKopi arabika",
    ts: Date.now() - 2 * 86400_000,
  },
  {
    id: "n4",
    folder: "work",
    title: "Meeting Notes — Sprint 24",
    body: "- Rilis v2.3 mundur ke Kamis\n- Fokus perbaikan animasi transisi\n- Sari handle QA regresi\n- Aku siapkan changelog",
    ts: Date.now() - 3 * 86400_000,
  },
  {
    id: "n5",
    folder: "work",
    title: "Checklist Rilis",
    body: "☑ Build final lolos\n☐ Changelog ditulis\n☐ Screenshot App Store diperbarui\n☐ Email blast ke beta tester",
    ts: Date.now() - 5 * 86400_000,
  },
];

export default function NotesApp() {
  const t = useT();
  const lang = useSettings((s) => s.lang);
  const [notes, setNotes] = useLocalState<Note[]>("notes", DEFAULT_NOTES);
  const [folder, setFolder] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [closing, setClosing] = useState(false);

  const open = notes.find((n) => n.id === openId);

  const fmt = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return `${pad2(d.getHours())}.${pad2(d.getMinutes())}`;
    const yest = new Date(now);
    yest.setDate(now.getDate() - 1);
    if (d.toDateString() === yest.toDateString()) return t("common.yesterday");
    return `${d.getDate()} ${translate(lang, `time.months.${d.getMonth() + 1}`)}`;
  };

  const update = (id: string, patch: Partial<Note>) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch, ts: Date.now() } : n)));
  };

  const addNote = (f: string) => {
    const id = `n-${Date.now()}`;
    setNotes((prev) => [{ id, folder: f, title: "", body: "", ts: Date.now() }, ...prev]);
    Sfx.tick();
    setOpenId(id);
  };

  const del = async () => {
    if (!open) return;
    const i = await showAlert({
      title: t("common.delete"),
      message: t("notes.deleteConfirm"),
      buttons: [t("common.delete"), t("common.cancel")],
      cancelIndex: 1,
    });
    if (i === 0) {
      Sfx.whoosh();
      Haptics.success();
      setClosing(true);
      window.setTimeout(() => {
        setNotes((prev) => prev.filter((n) => n.id !== open.id));
      }, 220);
    }
  };

  const sorted = (list: Note[]) => [...list].sort((a, b) => b.ts - a.ts);

  if (open) {
    return (
      <motion.div
        animate={closing ? { x: "60%", opacity: 0 } : { x: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 380, damping: 34 }}
        style={{ position: "absolute", inset: 0, background: "#000", zIndex: 60, display: "flex", flexDirection: "column" }}
      >
        <div style={{ paddingTop: 62 }}>
          <div style={{ height: 46, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 12px" }}>
            <button
              onClick={() => {
                Sfx.tick();
                setOpenId(null);
              }}
              style={{ color: "#0a84ff", display: "flex", alignItems: "center", fontSize: 17 }}
            >
              <ChevronLeft size={24} strokeWidth={2.2} />
              {folder ? (folder === "all" ? t("notes.folderAll") : t(FOLDERS.find((f) => f.id === folder)?.key ?? "app.notes")) : t("app.notes")}
            </button>
            <button onClick={del} style={{ color: "#0a84ff" }}>
              <Trash size={21} strokeWidth={2} />
            </button>
          </div>
        </div>
        <div className="scroll-y" style={{ flex: 1, padding: "6px 22px 60px" }}>
          <div style={{ fontSize: 13, opacity: 0.45, marginBottom: 8 }}>
            {new Date(open.ts).getDate()} {translate(lang, `time.months.${new Date(open.ts).getMonth() + 1}`)}{" "}
            {new Date(open.ts).getFullYear()} · {pad2(new Date(open.ts).getHours())}.{pad2(new Date(open.ts).getMinutes())}
          </div>
          <input
            value={open.title}
            onChange={(e) => update(open.id, { title: e.target.value })}
            placeholder={t("notes.new")}
            style={{ width: "100%", fontSize: 25, fontWeight: 700, marginBottom: 10, color: "#fff" }}
          />
          <textarea
            value={open.body}
            onChange={(e) => update(open.id, { body: e.target.value })}
            placeholder={t("notes.placeholder")}
            style={{ width: "100%", minHeight: 420, fontSize: 17, lineHeight: 1.45, resize: "none", color: "#fff" }}
          />
        </div>
      </motion.div>
    );
  }

  if (folder) {
    const folderName = folder === "all" ? t("notes.folderAll") : t(FOLDERS.find((f) => f.id === folder)?.key ?? "app.notes");
    const list = sorted(notes.filter((n) => folder === "all" || n.folder === folder)).filter(
      (n) =>
        !query ||
        n.title.toLowerCase().includes(query.toLowerCase()) ||
        n.body.toLowerCase().includes(query.toLowerCase()),
    );
    return (
      <PushView onClose={() => setFolder(null)}>
        <div style={{ position: "absolute", inset: 0, background: "var(--app-bg)" }}>
          <div className="glass" style={{ paddingTop: 62, zIndex: 30 }}>
            <div style={{ height: 46, display: "flex", alignItems: "center", padding: "0 12px" }}>
              <button
                onClick={() => {
                  Sfx.tick();
                  setFolder(null);
                }}
                style={{ color: "var(--blue)", display: "flex", alignItems: "center", fontSize: 17, width: 90 }}
              >
                <ChevronLeft size={24} strokeWidth={2.2} />
                {t("notes.folders")}
              </button>
              <div style={{ flex: 1, textAlign: "center", fontSize: 16, fontWeight: 600 }}>{folderName}</div>
              <div style={{ width: 90, display: "flex", justifyContent: "flex-end" }}>
                <button onClick={() => addNote(folder === "all" ? "general" : folder)} style={{ color: "var(--blue)" }}>
                  <PencilIco size={21} strokeWidth={2} />
                </button>
              </div>
            </div>
          </div>
          <div className="scroll-y" id="app-scroll" style={{ position: "absolute", inset: 0, paddingTop: 120, paddingBottom: 90 }}>
            <div style={{ padding: "0 16px 12px" }}>
              <SearchBar value={query} onChange={setQuery} placeholder={t("notes.searchPlaceholder")} />
            </div>
            <div style={{ margin: "0 16px", borderRadius: 12, background: "var(--card)", overflow: "hidden" }}>
              {list.map((n, i) => (
                <div
                  key={n.id}
                  onClick={() => {
                    Sfx.tick();
                    setOpenId(n.id);
                  }}
                  className={i > 0 ? "list-sep" : undefined}
                  style={{ padding: "11px 16px", cursor: "pointer" }}
                >
                  <div style={{ fontSize: 16.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {n.title || t("notes.new")}
                  </div>
                  <div style={{ fontSize: 14, opacity: 0.5, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {fmt(n.ts)} · {n.body.replace(/\n/g, " ").slice(0, 60) || t("notes.placeholder")}
                  </div>
                </div>
              ))}
            </div>
            {list.length === 0 && (
              <div style={{ textAlign: "center", opacity: 0.4, marginTop: 70, fontSize: 15 }}>{t("notes.empty")}</div>
            )}
          </div>
          <button
            onClick={() => addNote(folder === "all" ? "general" : folder)}
            className="glass"
            style={{
              position: "absolute",
              right: 20,
              bottom: 46,
              width: 52,
              height: 52,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--blue)",
              zIndex: 40,
            }}
          >
            <Plus size={26} strokeWidth={2.2} />
          </button>
        </div>
      </PushView>
    );
  }

  const recent = sorted(notes).slice(0, 3);

  return (
    <div style={{ position: "absolute", inset: 0, background: "var(--app-bg)" }}>
      <NavBar
        title={t("app.notes")}
        right={
          <button
            onClick={() => {
              Haptics.light();
              addNote("general");
            }}
            style={{ color: "var(--blue)" }}
          >
            <PencilIco size={22} strokeWidth={2} />
          </button>
        }
      />
      <div className="scroll-y" id="app-scroll" style={{ position: "absolute", inset: 0, paddingTop: 162, paddingBottom: 120 }}>
        <div style={{ margin: "0 16px", borderRadius: 12, background: "var(--card)", overflow: "hidden" }}>
          {[
            { id: "all", name: t("notes.folderAll"), count: notes.length },
            ...FOLDERS.map((f) => ({ id: f.id, name: t(f.key), count: notes.filter((n) => n.folder === f.id).length })),
          ].map((f, i) => (
            <div
              key={f.id}
              onClick={() => {
                Sfx.tick();
                setFolder(f.id);
              }}
              className={i > 0 ? "list-sep" : undefined}
              style={{ display: "flex", alignItems: "center", gap: 13, padding: "13px 16px", cursor: "pointer" }}
            >
              <FolderIco size={22} color="#ffd60a" />
              <span style={{ flex: 1, fontSize: 17, fontWeight: 500 }}>{f.name}</span>
              <span style={{ fontSize: 17, opacity: 0.45 }}>{f.count}</span>
              <ChevronRight size={15} style={{ opacity: 0.3 }} />
            </div>
          ))}
        </div>
        <div style={{ padding: "22px 32px 7px", fontSize: 13, opacity: 0.55, textTransform: "uppercase", letterSpacing: 0.6 }}>
          {t("notes.recentlyEdited")}
        </div>
        <div style={{ margin: "0 16px", borderRadius: 12, background: "var(--card)", overflow: "hidden" }}>
          {recent.map((n, i) => (
            <div
              key={n.id}
              onClick={() => {
                Sfx.tick();
                setOpenId(n.id);
              }}
              className={i > 0 ? "list-sep" : undefined}
              style={{ padding: "12px 16px", cursor: "pointer" }}
            >
              <div style={{ fontSize: 16, fontWeight: 600 }}>{n.title || t("notes.new")}</div>
              <div style={{ fontSize: 13.5, opacity: 0.5, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {fmt(n.ts)} · {n.body.replace(/\n/g, " ").slice(0, 50)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
