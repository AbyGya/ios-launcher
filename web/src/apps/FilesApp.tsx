import { useMemo, useState } from "react";
import { useT } from "../i18n";
import { Sfx } from "../lib/sfx";
import { Haptics } from "../lib/haptics";
import { generatePhoto } from "../lib/wallpaper";
import { NavBar, PushView, Sheet, showAlert } from "../components/ui/surfaces";
import { ChevronLeft, ChevronRight, FolderIco, MusicNoteIco, Person, TimerIco, Xmark } from "../icons/Sys";

type Kind = "folder" | "pdf" | "doc" | "img" | "zip" | "audio";

interface FNode {
  id: string;
  name: string;
  kind: Kind;
  size?: string;
  date: string;
  seed?: number;
  children?: FNode[];
}

const TREE: FNode[] = [
  {
    id: "icloud",
    name: "iCloud Drive",
    kind: "folder",
    date: "-",
    children: [
      {
        id: "documents",
        name: "Documents",
        kind: "folder",
        date: "12 Okt 2026",
        children: [
          { id: "f-cv", name: "CV-Abi-Gunawan.pdf", kind: "pdf", size: "240 KB", date: "12 Okt 2026" },
          { id: "f-proposal", name: "Proposal-Proyek.docx", kind: "doc", size: "65 KB", date: "8 Okt 2026" },
          { id: "f-budget", name: "Anggaran-Q4.xlsx", kind: "doc", size: "34 KB", date: "2 Okt 2026" },
        ],
      },
      {
        id: "projects",
        name: "Projects",
        kind: "folder",
        date: "14 Okt 2026",
        children: [
          { id: "f-fig", name: "app-design.fig", kind: "doc", size: "12 MB", date: "14 Okt 2026" },
          { id: "f-zip", name: "export-final.zip", kind: "zip", size: "84 MB", date: "14 Okt 2026" },
          { id: "f-shot", name: "screenshot-home.png", kind: "img", size: "2,4 MB", date: "13 Okt 2026", seed: 3 },
        ],
      },
      {
        id: "photos-folder",
        name: "Photos",
        kind: "folder",
        date: "11 Okt 2026",
        children: [
          { id: "f-i1", name: "IMG-0491.png", kind: "img", size: "2,1 MB", date: "11 Okt 2026", seed: 11 },
          { id: "f-i2", name: "IMG-0492.png", kind: "img", size: "1,8 MB", date: "11 Okt 2026", seed: 12 },
          { id: "f-i3", name: "IMG-0493.png", kind: "img", size: "2,6 MB", date: "10 Okt 2026", seed: 13 },
        ],
      },
      {
        id: "music-folder",
        name: "Music",
        kind: "folder",
        date: "6 Okt 2026",
        children: [
          { id: "f-memo", name: "memo-rapat.m4a", kind: "audio", size: "4,2 MB", date: "6 Okt 2026" },
          { id: "f-song", name: "demo-lagu.mp3", kind: "audio", size: "8,7 MB", date: "28 Sep 2026" },
        ],
      },
    ],
  },
  {
    id: "iphone",
    name: "On My iPhone",
    kind: "folder",
    date: "-",
    children: [
      {
        id: "downloads",
        name: "Downloads",
        kind: "folder",
        date: "9 Okt 2026",
        children: [{ id: "f-invoice", name: "invoice-oktober.pdf", kind: "pdf", size: "180 KB", date: "9 Okt 2026" }],
      },
      {
        id: "scans",
        name: "Scans",
        kind: "folder",
        date: "3 Okt 2026",
        children: [{ id: "f-scan", name: "scan-struk.jpg", kind: "img", size: "1,2 MB", date: "3 Okt 2026", seed: 7 }],
      },
    ],
  },
];

function flatten(nodes: FNode[]): FNode[] {
  const out: FNode[] = [];
  const walk = (list: FNode[]) => {
    for (const n of list) {
      if (n.kind === "folder") walk(n.children ?? []);
      else out.push(n);
    }
  };
  walk(nodes);
  return out;
}

function DocIco({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round">
      <path d="M6 3.5h8l4 4v13H6z" fill="rgba(255,255,255,0.16)" />
      <path d="M9 12h6M9 15.5h4" />
    </svg>
  );
}

function ZipIco({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3.5h8l4 4v13H6z" fill="rgba(255,255,255,0.16)" />
      <path d="M12 3.5v2.4M12 7.4v2.4M12 11.3v2.4M10.6 16h3v3.4h-3z" />
    </svg>
  );
}

const KIND_BG: Record<Kind, string> = {
  folder: "linear-gradient(180deg,#4da3ff,#0a6cff)",
  pdf: "linear-gradient(180deg,#ff6a60,#e0362b)",
  doc: "linear-gradient(180deg,#4da3ff,#0a6cff)",
  img: "",
  zip: "linear-gradient(180deg,#c8a468,#96703a)",
  audio: "linear-gradient(180deg,#d077f5,#a338d6)",
};

export default function FilesApp() {
  const t = useT();
  const [path, setPath] = useState<FNode[]>([]);
  const [preview, setPreview] = useState<FNode | null>(null);

  const recents = useMemo(() => flatten(TREE), []);
  const thumbs = useMemo(() => {
    const map: Record<number, string> = {};
    for (const n of recents) if (n.kind === "img" && n.seed) map[n.seed] = generatePhoto(n.seed);
    for (const n of TREE) for (const c of n.children ?? []) for (const g of c.children ?? []) if (g.kind === "img" && g.seed) map[g.seed] = generatePhoto(g.seed);
    return map;
  }, [recents]);

  const current = path.length ? path[path.length - 1] : null;
  const listing: FNode[] = current
    ? current.id === "__recents"
      ? recents
      : current.id === "__shared"
        ? []
        : current.children ?? []
    : [];

  const openNode = (n: FNode) => {
    if (n.kind === "folder") {
      Sfx.tick();
      setPath((p) => [...p, n]);
    } else if (n.kind === "img") {
      Sfx.tick();
      Haptics.light();
      setPreview(n);
    } else {
      Sfx.tick();
      void showAlert({
        title: n.name,
        message: `${n.size} · ${n.date}\n\n${t("files.cannotOpen")}`,
        buttons: [t("common.ok")],
      });
    }
  };

  const FileIcon = ({ n, size = 42 }: { n: FNode; size?: number }) => {
    if (n.kind === "img" && n.seed) {
      return (
        <div style={{ width: size, height: size, borderRadius: 9, overflow: "hidden", flexShrink: 0, border: "0.5px solid rgba(255,255,255,0.14)" }}>
          <img src={thumbs[n.seed]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      );
    }
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: 9,
          background: KIND_BG[n.kind],
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          fontSize: 9.5,
          fontWeight: 800,
          color: "#fff",
          letterSpacing: 0.3,
        }}
      >
        {n.kind === "pdf" ? "PDF" : n.kind === "doc" ? <DocIco /> : n.kind === "zip" ? <ZipIco /> : n.kind === "audio" ? <MusicNoteIco size={19} color="#fff" strokeWidth={2.1} /> : n.kind === "folder" ? <FolderIco size={21} color="#fff" strokeWidth={2.1} /> : null}
      </div>
    );
  };

  if (current) {
    return (
      <PushView onClose={() => setPath((p) => p.slice(0, -1))}>
        <div style={{ position: "absolute", inset: 0, background: "var(--app-bg)" }}>
          <div className="glass" style={{ paddingTop: 62, zIndex: 30 }}>
            <div style={{ height: 46, display: "flex", alignItems: "center", padding: "0 12px" }}>
              <button
                onClick={() => {
                  Sfx.tick();
                  setPath((p) => p.slice(0, -1));
                }}
                style={{ color: "var(--blue)", display: "flex", alignItems: "center", fontSize: 17, minWidth: 84 }}
              >
                <ChevronLeft size={24} strokeWidth={2.2} />
                {path.length > 1 ? (path[path.length - 2].id === "icloud" ? "iCloud" : path[path.length - 2].name) : t("app.files")}
              </button>
              <div style={{ flex: 1, textAlign: "center", fontSize: 16, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {current.name}
              </div>
              <div style={{ minWidth: 84 }} />
            </div>
          </div>
          <div className="scroll-y" id="app-scroll" style={{ position: "absolute", inset: 0, paddingTop: 118, paddingBottom: 90 }}>
            <div style={{ padding: "4px 26px 10px", fontSize: 13, opacity: 0.5 }}>
              {listing.length} {t("files.items")}
            </div>
            {listing.map((n, i) => (
              <button
                key={n.id}
                onClick={() => openNode(n)}
                className={i > 0 ? "list-sep" : undefined}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 13, padding: "9px 18px", textAlign: "left" }}
              >
                <FileIcon n={n} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 16.5, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n.name}</div>
                  <div style={{ fontSize: 13, opacity: 0.5, marginTop: 1 }}>
                    {n.date}
                    {n.kind === "folder" ? ` · ${(n.children ?? []).length} ${t("files.items")}` : ""}
                  </div>
                </div>
                {n.size && <span style={{ fontSize: 14, opacity: 0.5 }}>{n.size}</span>}
                {n.kind === "folder" && <ChevronRight size={15} style={{ opacity: 0.3 }} />}
              </button>
            ))}
            {listing.length === 0 && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginTop: 80 }}>
                <Person size={34} color="rgba(140,140,150,0.7)" strokeWidth={1.6} />
                <span style={{ fontSize: 14.5, opacity: 0.45 }}>{t("files.sharedEmpty")}</span>
              </div>
            )}
          </div>

          <Sheet open={!!preview} onClose={() => setPreview(null)} height="72%">
            {preview && preview.seed && (
              <div style={{ padding: "8px 18px 40px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <div style={{ minWidth: 36 }} />
                  <span style={{ fontSize: 15.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1, textAlign: "center" }}>
                    {preview.name}
                  </span>
                  <button
                    onClick={() => setPreview(null)}
                    style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(120,120,128,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <Xmark size={14} strokeWidth={2.6} color="rgba(170,170,180,1)" />
                  </button>
                </div>
                <img src={thumbs[preview.seed]} alt="" style={{ width: "100%", maxHeight: 420, objectFit: "contain", borderRadius: 14 }} />
                <div style={{ display: "flex", justifyContent: "center", gap: 18, marginTop: 16, fontSize: 13, opacity: 0.55 }}>
                  <span>{preview.size}</span>
                  <span>{preview.date}</span>
                </div>
              </div>
            )}
          </Sheet>
        </div>
      </PushView>
    );
  }

  const rootRows = [
    { node: TREE[0], label: "iCloud Drive", icon: <FolderIco size={20} color="#fff" strokeWidth={2.1} />, bg: "#0a84ff", sub: `${flatten([TREE[0]]).length} ${t("files.items")}` },
    { node: TREE[1], label: t("files.onMyIphone"), icon: <FolderIco size={20} color="#fff" strokeWidth={2.1} />, bg: "#8e8e93", sub: `${flatten([TREE[1]]).length} ${t("files.items")}` },
  ];

  return (
    <div style={{ position: "absolute", inset: 0, background: "var(--app-bg)" }}>
      <NavBar title={t("app.files")} />
      <div className="scroll-y" id="app-scroll" style={{ position: "absolute", inset: 0, paddingTop: 162, paddingBottom: 120 }}>
        <div style={{ margin: "0 16px 18px", borderRadius: 12, background: "var(--card)", padding: "14px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 9 }}>
            <span style={{ fontWeight: 600 }}>{t("settings.storage")}</span>
            <span style={{ opacity: 0.55 }}>182 GB / 256 GB</span>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: "rgba(120,120,128,0.24)", overflow: "hidden", display: "flex" }}>
            <div style={{ width: "38%", background: "#0a84ff" }} />
            <div style={{ width: "18%", background: "#bf5af2" }} />
            <div style={{ width: "14%", background: "#ff9f0a" }} />
          </div>
          <div style={{ display: "flex", gap: 14, marginTop: 9, fontSize: 11.5, opacity: 0.6 }}>
            <span style={{ color: "#0a84ff" }}>● Apps</span>
            <span style={{ color: "#bf5af2" }}>● Photos</span>
            <span style={{ color: "#ff9f0a" }}>● System</span>
          </div>
        </div>

        <div style={{ margin: "0 16px", borderRadius: 12, background: "var(--card)", overflow: "hidden" }}>
          {rootRows.map((r, i) => (
            <button
              key={r.label}
              onClick={() => {
                Sfx.tick();
                setPath([r.node]);
              }}
              className={i > 0 ? "list-sep" : undefined}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 13, padding: "12px 16px", textAlign: "left" }}
            >
              <div style={{ width: 29, height: 29, borderRadius: 8, background: r.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>{r.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 17, fontWeight: 500 }}>{r.label}</div>
                <div style={{ fontSize: 12.5, opacity: 0.5, marginTop: 1 }}>{r.sub}</div>
              </div>
              <ChevronRight size={15} style={{ opacity: 0.3 }} />
            </button>
          ))}
          {[
            { id: "__recents", label: t("files.recents"), icon: <TimerIco size={19} color="#fff" strokeWidth={2.1} />, bg: "#ff9f0a" },
            { id: "__shared", label: t("files.shared"), icon: <Person size={19} color="#fff" strokeWidth={2.1} />, bg: "#bf5af2" },
          ].map((r) => (
            <button
              key={r.id}
              onClick={() => {
                Sfx.tick();
                setPath([{ id: r.id, name: r.label, kind: "folder", date: "-" }]);
              }}
              className="list-sep"
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 13, padding: "12px 16px", textAlign: "left" }}
            >
              <div style={{ width: 29, height: 29, borderRadius: 8, background: r.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>{r.icon}</div>
              <span style={{ flex: 1, fontSize: 17, fontWeight: 500 }}>{r.label}</span>
              <ChevronRight size={15} style={{ opacity: 0.3 }} />
            </button>
          ))}
        </div>

        <div style={{ padding: "24px 32px 7px", fontSize: 13, opacity: 0.55, textTransform: "uppercase", letterSpacing: 0.6 }}>
          {t("files.recents")}
        </div>
        <div style={{ margin: "0 16px", borderRadius: 12, background: "var(--card)", overflow: "hidden" }}>
          {recents.slice(0, 3).map((n, i) => (
            <button
              key={n.id}
              onClick={() => openNode(n)}
              className={i > 0 ? "list-sep" : undefined}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 13, padding: "9px 16px", textAlign: "left" }}
            >
              <FileIcon n={n} size={36} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15.5, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n.name}</div>
                <div style={{ fontSize: 12.5, opacity: 0.5, marginTop: 1 }}>{n.date}</div>
              </div>
              <span style={{ fontSize: 13.5, opacity: 0.5 }}>{n.size}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
