import { useRef, useState, type ReactNode } from "react";
import { AnimatePresence } from "framer-motion";
import { useT } from "../i18n";
import { useSettings, type WallpaperId } from "../store/settings";
import { useSystem } from "../store/system";
import { useIsland } from "../store/island";
import { usePhotos } from "../store/photos";
import { generateWallpaper } from "../lib/wallpaper";
import { Sfx } from "../lib/sfx";
import { Haptics } from "../lib/haptics";
import { initials } from "../lib/util";
import { ListGroup, ListRow, NavBar, PushView, showAlert } from "../components/ui/surfaces";
import { SearchBar, Segmented, Slider, Switch } from "../components/ui/controls";
import { BatteryIcon, BellIco, CameraGlyph, ChevronRight, FaceIDIco, GearIco, GridIco, Moon, Person, Sun, VolumeHigh, WorldIco } from "../icons/Sys";
import { AppIconArt } from "../icons/AppIcons";

const WALLPAPERS: { id: WallpaperId; name: string }[] = [
  { id: "cosmic", name: "Cosmic" },
  { id: "dusk", name: "Dusk" },
  { id: "ocean", name: "Ocean" },
  { id: "bloom", name: "Bloom" },
  { id: "mono", name: "Mono" },
  { id: "aurora", name: "Aurora" },
];

function Page({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const lang = useSettings((s) => s.lang);
  return (
    <PushView onClose={onClose}>
      <div className="scroll-y" style={{ position: "absolute", inset: 0, background: "var(--app-bg)", paddingTop: 110, paddingBottom: 60 }}>
        <div className="glass" style={{ position: "absolute", top: 0, left: 0, right: 0, paddingTop: 56, zIndex: 10 }}>
          <div style={{ height: 44, display: "flex", alignItems: "center", padding: "0 8px" }}>
            <button onClick={onClose} style={{ display: "flex", alignItems: "center", color: "var(--blue)", fontSize: 17, padding: "0 8px" }}>
              ‹ {lang === "id" ? "Kembali" : "Back"}
            </button>
            <div style={{ position: "absolute", left: 0, right: 0, textAlign: "center", fontSize: 17, fontWeight: 600, pointerEvents: "none" }}>{title}</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>{children}</div>
      </div>
    </PushView>
  );
}

function AppearancePage({ onClose }: { onClose: () => void }) {
  const lang = useSettings((s) => s.lang);
  const settings = useSettings();
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <Page title={lang === "id" ? "Tampilan" : "Appearance"} onClose={onClose}>
      <ListGroup header={lang === "id" ? "TEMA" : "THEME"}>
        <div style={{ padding: "12px 16px" }}>
          <Segmented
            options={["Otomatis", "Terang", "Gelap"].map((x, i) => (i === 0 ? (lang === "id" ? "Otomatis" : "Auto") : i === 1 ? (lang === "id" ? "Terang" : "Light") : lang === "id" ? "Gelap" : "Dark"))}
            value={settings.theme === "auto" ? 0 : settings.theme === "light" ? 1 : 2}
            onChange={(i) => settings.set({ theme: i === 0 ? "auto" : i === 1 ? "light" : "dark" })}
          />
        </div>
      </ListGroup>
      <ListGroup header="WALLPAPER" footer={lang === "id" ? "Wallpaper di-generate secara prosedural di perangkat ini — tanpa file eksternal." : "Wallpapers are generated procedurally on-device — no external files."}>
        <div style={{ padding: 14, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {WALLPAPERS.map((w) => (
            <button
              key={w.id}
              onClick={() => {
                Haptics.selection();
                Sfx.tick();
                settings.set({ wallpaper: w.id, customWallpaper: null });
              }}
              style={{ position: "relative", aspectRatio: "0.62", borderRadius: 12, overflow: "hidden", border: settings.wallpaper === w.id ? "2.5px solid var(--blue)" : "2.5px solid transparent" }}
            >
              <img src={generateWallpaper(w.id)} alt={w.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <span style={{ position: "absolute", bottom: 6, left: 8, fontSize: 10.5, color: "#fff", textShadow: "0 1px 4px rgba(0,0,0,0.7)", fontWeight: 600 }}>{w.name}</span>
            </button>
          ))}
          <button
            onClick={() => fileRef.current?.click()}
            style={{ aspectRatio: "0.62", borderRadius: 12, overflow: "hidden", border: settings.wallpaper === "custom" ? "2.5px solid var(--blue)" : "2.5px dashed rgba(130,130,140,0.6)", background: "rgba(120,120,128,0.14)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, position: "relative" }}
          >
            {settings.customWallpaper ? (
              <img src={settings.customWallpaper} alt="custom" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <>
                <span style={{ fontSize: 26, opacity: 0.5 }}>＋</span>
                <span style={{ fontSize: 11, opacity: 0.55 }}>{lang === "id" ? "Foto Sendiri" : "Your Photo"}</span>
              </>
            )}
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const reader = new FileReader();
            reader.onload = () => {
              settings.set({ customWallpaper: String(reader.result), wallpaper: "custom" });
              Sfx.tick();
            };
            reader.readAsDataURL(f);
          }}
        />
      </ListGroup>
      <ListGroup header={lang === "id" ? "WARNA PERANGKAT" : "DEVICE FINISH"}>
        <div style={{ padding: "12px 16px" }}>
          <Segmented
            options={["Cosmic", "Deep Blue", "Silver"]}
            value={settings.deviceColor === "cosmic" ? 0 : settings.deviceColor === "deepblue" ? 1 : 2}
            onChange={(i) => settings.set({ deviceColor: i === 0 ? "cosmic" : i === 1 ? "deepblue" : "silver" })}
          />
        </div>
        <ListRow sep label={lang === "id" ? "Jam kaca besar" : "Large glass clock"} right={<Switch checked={settings.clockGlass} onChange={(v) => settings.set({ clockGlass: v })} />} compact />
        <ListRow label={lang === "id" ? "Animasi boot" : "Boot animation"} right={<Switch checked={settings.bootAnimation} onChange={(v) => settings.set({ bootAnimation: v })} />} compact />
      </ListGroup>
      <ListGroup header="PRO DISPLAY" footer={lang === "id" ? "ProMotion 120Hz disimulasikan dengan animasi CSS + requestAnimationFrame." : "ProMotion 120Hz is simulated with CSS animation + requestAnimationFrame."}>
        <ListRow sep label={lang === "id" ? "Gerak dinamis" : "Dynamic motion"} right={<Switch checked onChange={() => void 0} />} compact />
        <ListRow label={lang === "id" ? "Selalu Aktif" : "Always-On"} right={<Switch checked={settings.clockGlass} onChange={(v) => settings.set({ clockGlass: v })} />} compact />
      </ListGroup>
    </Page>
  );
}

function SoundsPage({ onClose }: { onClose: () => void }) {
  const lang = useSettings((s) => s.lang);
  const settings = useSettings();
  return (
    <Page title={lang === "id" ? "Suara & Getaran" : "Sounds & Haptics"} onClose={onClose}>
      <ListGroup header={lang === "id" ? "VOLUME" : "VOLUME"}>
        <div style={{ padding: "18px 16px" }}>
          <Slider
            value={settings.volume}
            length={320}
            thickness={34}
            icon={<VolumeHigh size={18} color="#fff" />}
            onChange={(v) => settings.set({ volume: v })}
            onEnd={() => Sfx.tick()}
          />
        </div>
        <ListRow sep icon={<BellIco size={16} />} iconBg="#ff453a" label={lang === "id" ? "Suara dering" : "Ringtone"} value="Reflection" chevron compact />
        <ListRow icon={<BellIco size={16} />} iconBg="#0a84ff" label={lang === "id" ? "Suara pesan" : "Text tone"} value="Note" chevron compact />
      </ListGroup>
      <ListGroup header={lang === "id" ? "GETARAN" : "HAPTICS"}>
        <ListRow label={lang === "id" ? "Getar saat dering" : "Vibrate on ring"} right={<Switch checked={settings.haptics} onChange={(v) => settings.set({ haptics: v })} />} compact />
        <ListRow label={lang === "id" ? "Getar saat senyap" : "Vibrate on silent"} right={<Switch checked={settings.haptics} onChange={(v) => settings.set({ haptics: v })} />} compact />
        <ListRow label={lang === "id" ? "Klaim suara sistem" : "System sounds"} right={<Switch checked={settings.sounds} onChange={(v) => settings.set({ sounds: v })} />} compact />
      </ListGroup>
      <ListGroup footer={lang === "id" ? "Semua suara dan musik disintesis real-time dengan Web Audio API." : "All sounds and music are synthesized in real-time with the Web Audio API."}>
        <ListRow label={lang === "id" ? "Uji semua efek suara" : "Test all sound effects"} onClick={() => { Sfx.ding(); window.setTimeout(() => Sfx.receive(), 260); window.setTimeout(() => Sfx.whoosh(), 520); }} chevron compact />
      </ListGroup>
    </Page>
  );
}

function DisplayPage({ onClose }: { onClose: () => void }) {
  const lang = useSettings((s) => s.lang);
  const settings = useSettings();
  return (
    <Page title={lang === "id" ? "Layar & Kecerahan" : "Display & Brightness"} onClose={onClose}>
      <ListGroup header={lang === "id" ? "KECERAHAN" : "BRIGHTNESS"}>
        <div style={{ padding: "18px 16px" }}>
          <Slider
            value={settings.brightness}
            length={320}
            thickness={34}
            icon={<Sun size={18} color="#fff" />}
            onChange={(v) => settings.set({ brightness: v })}
            onEnd={() => Sfx.tick()}
          />
        </div>
        <ListRow label="True Tone" right={<Switch checked={settings.trueTone} onChange={(v) => settings.set({ trueTone: v })} />} compact />
        <ListRow label="Night Shift" right={<Switch checked={settings.nightShift} onChange={(v) => settings.set({ nightShift: v })} />} compact />
        <ListRow label={lang === "id" ? "Kecerahan otomatis" : "Auto-Brightness"} right={<Switch checked={settings.autoBrightness} onChange={(v) => settings.set({ autoBrightness: v })} />} compact />
      </ListGroup>
      <ListGroup header="DISPLAY" footer={lang === "id" ? "Super Retina XDR · 440×956 pt · ProMotion 120Hz disimulasikan dengan animasi CSS." : "Super Retina XDR · 440×956 pt · ProMotion 120Hz simulated with CSS animation."}>
        <ListRow label={lang === "id" ? "Zoom layar" : "Display zoom"} value={lang === "id" ? "Standar" : "Standard"} chevron compact />
        <ListRow label={lang === "id" ? "Always-On Display" : "Always-On Display"} right={<Switch checked={settings.clockGlass} onChange={(v) => settings.set({ clockGlass: v })} />} compact />
      </ListGroup>
    </Page>
  );
}

export default function SettingsApp() {
  const t = useT();
  const lang = useSettings((s) => s.lang);
  const settings = useSettings();
  const sys = useSystem();
  const [page, setPage] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [deviceName, setDeviceName] = useState(settings.deviceName);

  const groups: { title: string; rows: { label: string; value?: string; icon: ReactNode; bg: string; action?: () => void; right?: ReactNode }[] }[] = [
    {
      title: lang === "id" ? "SISTEM" : "SYSTEM",
      rows: [
        {
          label: lang === "id" ? "Umum" : "General",
          icon: <GearIco size={16} />,
          bg: "#8e8e93",
          action: () => setPage("general"),
        },
        {
          label: t("settings.appearance"),
          icon: <Sun size={16} />,
          bg: "#0a84ff",
          action: () => setPage("appearance"),
        },
        {
          label: lang === "id" ? "Dinding Layar" : "Wallpaper",
          icon: <GridIco size={16} />,
          bg: "#5e5ce6",
          action: () => setPage("appearance"),
        },
        {
          label: t("settings.display"),
          icon: <Moon size={16} />,
          bg: "#bf5af2",
          action: () => setPage("display"),
        },
        {
          label: t("settings.sounds"),
          icon: <VolumeHigh size={16} />,
          bg: "#ff375f",
          action: () => setPage("sounds"),
        },
      ],
    },
    {
      title: lang === "id" ? "FITUR" : "FEATURES",
      rows: [
        {
          label: lang === "id" ? "Kamera" : "Camera",
          icon: <CameraGlyph size={16} />,
          bg: "#48484a",
          action: () => setPage("camera"),
        },
        {
          label: lang === "id" ? "Face ID & Kode" : "Face ID & Passcode",
          icon: <FaceIDIco size={16} />,
          bg: "#30d158",
          action: () => setPage("faceid"),
        },
        {
          label: lang === "id" ? "Notifikasi" : "Notifications",
          icon: <BellIco size={16} />,
          bg: "#ff453a",
          action: () => setPage("notifications"),
        },
        {
          label: lang === "id" ? "Baterai" : "Battery",
          icon: <BatteryIcon level={sys.batteryLevel} charging={sys.charging} color="currentColor" size={22} />,
          bg: "#30d158",
          value: `${sys.batteryLevel}%`,
          action: () => setPage("battery"),
        },
        {
          label: lang === "id" ? "Penyimpanan iPhone" : "iPhone Storage",
          icon: <GridIco size={16} />,
          bg: "#0a84ff",
          action: () => setPage("storage"),
        },
      ],
    },
    {
      title: lang === "id" ? "TENTANG" : "ABOUT",
      rows: [
        {
          label: lang === "id" ? "Nama Perangkat" : "Device Name",
          icon: <Person size={16} />,
          bg: "#ff9f0a",
          value: settings.deviceName,
          action: () => setPage("name"),
        },
        {
          label: lang === "id" ? "Bahasa & Wilayah" : "Language & Region",
          icon: <WorldIco size={16} />,
          bg: "#5e5ce6",
          value: settings.lang === "id" ? "Indonesia" : "English",
          action: () => setPage("language"),
        },
        {
          label: lang === "id" ? "Reset Semua Data" : "Reset All Data",
          icon: <Trash size={16} />,
          bg: "#ff453a",
          value: "",
          action: () => setPage("reset"),
        },
      ],
    },
  ];

  const filtered = query
    ? groups.map((g) => ({ ...g, rows: g.rows.filter((r) => r.label.toLowerCase().includes(query.toLowerCase())) })).filter((g) => g.rows.length)
    : groups;

  return (
    <div style={{ position: "absolute", inset: 0, background: "var(--app-bg)" }}>
      <NavBar title={t("settings.title")} />
      <div className="scroll-y" id="app-scroll" style={{ position: "absolute", inset: 0, paddingTop: 164, paddingBottom: 70 }}>
        <div style={{ padding: "0 16px 16px" }}>
          <SearchBar value={query} onChange={setQuery} placeholder={t("settings.search")} />
        </div>

        {!query && (
          <div style={{ margin: "0 16px 22px", borderRadius: 14, background: "var(--card)", padding: "16px", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(145deg,#0a84ff,#5e5ce6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 600, color: "#fff" }}>
              {initials(settings.deviceName.split("—").pop()?.trim() || settings.deviceName)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 600 }}>{settings.deviceName.split("—").pop()?.trim() || settings.deviceName}</div>
              <div style={{ fontSize: 13, opacity: 0.55, marginTop: 2 }}>Apple Account · iCloud+ · {lang === "id" ? "Penyimpanan 78% penuh" : "Storage 78% full"}</div>
            </div>
            <ChevronRight size={16} style={{ opacity: 0.3 }} />
          </div>
        )}

        {filtered.map((g) => (
          <div key={g.title} style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, textTransform: "uppercase", opacity: 0.55, padding: "0 32px 7px", letterSpacing: 0.6 }}>{g.title}</div>
            <div style={{ margin: "0 16px", borderRadius: 12, overflow: "hidden", background: "var(--card)" }}>
              {g.rows.map((r, i) => (
                <div
                  key={r.label}
                  onClick={r.action}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderTop: i > 0 ? "0.5px solid rgba(120,120,128,0.25)" : undefined, cursor: "pointer" }}
                >
                  <div style={{ width: 29, height: 29, borderRadius: 7, background: r.bg, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 }}>{r.icon}</div>
                  <span style={{ flex: 1, fontSize: 16.5 }}>{r.label}</span>
                  {r.value && <span style={{ fontSize: 15, opacity: 0.45 }}>{r.value}</span>}
                  {r.right}
                  <ChevronRight size={15} style={{ opacity: 0.3, marginRight: -4 }} />
                </div>
              ))}
            </div>
          </div>
        ))}

        <div style={{ textAlign: "center", fontSize: 12.5, opacity: 0.4, padding: "6px 0 30px" }}>
          iPhone 17 Pro Max (Simulator) · iOS 26.1 · {lang === "id" ? "Dibuat dengan React" : "Built with React"}
        </div>
      </div>

      <AnimatePresence>
        {page === "appearance" && <AppearancePage onClose={() => setPage(null)} />}
        {page === "sounds" && <SoundsPage onClose={() => setPage(null)} />}
        {page === "display" && <DisplayPage onClose={() => setPage(null)} />}

        {page === "general" && (
          <Page title={lang === "id" ? "Umum" : "General"} onClose={() => setPage(null)}>
            <ListGroup header={lang === "id" ? "TENTANG" : "ABOUT"}>
              <ListRow sep label={lang === "id" ? "Nama" : "Name"} value={deviceName} onClick={() => setPage("name")} />
              <ListRow sep label="iOS" value="26.1 (Simulator)" />
              <ListRow sep label={lang === "id" ? "Model" : "Model"} value="iPhone 17 Pro Max" />
              <ListRow sep label={lang === "id" ? "Nama Model" : "Model Name"} value="MU7A3ID/A" />
              <ListRow sep label={lang === "id" ? "Kapasitas" : "Capacity"} value="1 TB" />
              <ListRow sep label={lang === "id" ? "Tersedia" : "Available"} value={`${742 - usePhotos.getState().photos.length} GB`} />
              <ListRow label={lang === "id" ? "Versi" : "Version"} value="26A5268c" />
            </ListGroup>
            <ListGroup header={lang === "id" ? "PEMBARUAN" : "SOFTWARE UPDATE"}>
              <ListRow icon={<GearIco size={16} />} iconBg="#0a84ff" label="iOS 26.1" value={lang === "id" ? "Terbaru" : "Up to date"} chevron compact />
            </ListGroup>
            <ListGroup header="VPN">
              <ListRow label={lang === "id" ? "Tidak Terhubung" : "Not Connected"} right={<Switch checked={false} onChange={() => showAlert({ title: "VPN", message: lang === "id" ? "Fitur demo." : "Demo feature.", buttons: ["OK"] })} color="#0a84ff" />} compact />
            </ListGroup>
          </Page>
        )}

        {page === "language" && (
          <Page title={lang === "id" ? "Bahasa & Wilayah" : "Language & Region"} onClose={() => setPage(null)}>
            <ListGroup header={lang === "id" ? "BAHASA" : "LANGUAGE"} footer={lang === "id" ? "Seluruh antarmuka akan langsung beralih bahasa." : "The entire interface switches language immediately."}>
              <div style={{ padding: "14px 16px" }}>
                <Segmented
                  options={["Bahasa Indonesia", "English"]}
                  value={settings.lang === "id" ? 0 : 1}
                  onChange={(i) => {
                    settings.set({ lang: i === 0 ? "id" : "en" });
                    Haptics.success();
                    Sfx.tick();
                  }}
                />
              </div>
            </ListGroup>
            <ListGroup header={lang === "id" ? "WILAYAH" : "REGION"}>
              <ListRow sep label={lang === "id" ? "Wilayah" : "Region"} value={lang === "id" ? "Indonesia" : "United States"} chevron />
              <ListRow sep label={lang === "id" ? "Kalender" : "Calendar"} value="Gregorian" chevron />
              <ListRow label={lang === "id" ? "Format 24 Jam" : "24-Hour Time"} right={<Switch checked onChange={() => void 0} />} compact />
            </ListGroup>
          </Page>
        )}

        {page === "name" && (
          <Page title={lang === "id" ? "Nama" : "Name"} onClose={() => setPage(null)}>
            <ListGroup header={lang === "id" ? "NAMA PERANGKAT" : "DEVICE NAME"}>
              <div style={{ padding: 14 }}>
                <input
                  autoFocus
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      settings.set({ deviceName });
                      setPage(null);
                    }
                  }}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 10, background: "rgba(120,120,128,0.16)", fontSize: 17 }}
                />
              </div>
            </ListGroup>
            <div style={{ padding: "0 16px" }}>
              <button
                onClick={() => {
                  settings.set({ deviceName: deviceName.trim() || "iPhone" });
                  Sfx.tick();
                  setPage(null);
                }}
                style={{ width: "100%", padding: "13px 0", borderRadius: 12, background: "var(--blue)", color: "#fff", fontSize: 17, fontWeight: 600 }}
              >
                {t("common.done")}
              </button>
            </div>
          </Page>
        )}

        {page === "camera" && (
          <Page title={lang === "id" ? "Kamera" : "Camera"} onClose={() => setPage(null)}>
            <ListGroup header={lang === "id" ? "IZIN" : "PERMISSIONS"}>
              <ListRow
                sep
                icon={<CameraGlyph size={16} />}
                iconBg="#48484a"
                label={lang === "id" ? "Minta izin kamera & mikrofon" : "Request camera & mic permission"}
                onClick={() => {
                  navigator.mediaDevices
                    ?.getUserMedia({ video: true, audio: true })
                    .then((s) => {
                      s.getTracks().forEach((tr) => tr.stop());
                      void showAlert({ title: lang === "id" ? "Izin diberikan" : "Permission granted", message: lang === "id" ? "Kamera dan mikrofon siap digunakan." : "Camera and microphone are ready.", buttons: [t("common.done")] });
                    })
                    .catch(() => showAlert({ title: lang === "id" ? "Izin ditolak" : "Permission denied", message: lang === "id" ? "Aktifkan izin kamera di pengaturan browser." : "Enable camera permission in browser settings.", buttons: [t("common.done")] }));
                }}
                chevron
                compact
              />
              <ListRow label={lang === "id" ? "Kualitas video" : "Video quality"} value="4K · 60 fps" chevron compact />
              <ListRow label="HDR" right={<Switch checked onChange={() => void 0} />} compact />
            </ListGroup>
            <ListGroup footer={lang === "id" ? "Pratinjau langsung menggunakan getUserMedia dan MediaRecorder — benar-benar merekam dari perangkatmu." : "Live preview uses getUserMedia and MediaRecorder — actually recording from your device."}>
              <ListRow label={lang === "id" ? "Buka Kamera" : "Open Camera"} onClick={() => useSystem.getState().launchApp("camera")} chevron compact />
            </ListGroup>
          </Page>
        )}

        {page === "faceid" && (
          <Page title="Face ID & Passcode" onClose={() => setPage(null)}>
            <ListGroup>
              <ListRow sep icon={<FaceIDIco size={16} />} label={lang === "id" ? "Atur Face ID" : "Set Up Face ID"} chevron compact onClick={() => useIsland.getState().add({ kind: "faceid" })} />
              <ListRow label={lang === "id" ? "Kunci layar otomatis" : "Auto-Lock"} value={lang === "id" ? "1 menit" : "1 minute"} chevron compact />
            </ListGroup>
            <ListGroup footer={lang === "id" ? "Kunci perangkat dari sini untuk mencoba animasi Face ID." : "Lock the device from here to try the Face ID animation."}>
              <ListRow label={lang === "id" ? "Kunci Sekarang" : "Lock Now"} onClick={() => useSystem.getState().lockDevice()} chevron compact />
            </ListGroup>
          </Page>
        )}

        {page === "notifications" && (
          <Page title={lang === "id" ? "Notifikasi" : "Notifications"} onClose={() => setPage(null)}>
            <ListGroup header={lang === "id" ? "DEMO" : "DEMO"} footer={lang === "id" ? "Saat aktif, notifikasi acak akan muncul dari aplikasi berbeda." : "When enabled, random notifications appear from different apps."}>
              <ListRow sep label={lang === "id" ? "Notifikasi demo" : "Demo notifications"} right={<Switch checked={settings.demoNotifications} onChange={(v) => settings.set({ demoNotifications: v })} />} compact />
            </ListGroup>
            <ListGroup header={lang === "id" ? "GAYA" : "STYLE"}>
              <ListRow sep label={lang === "id" ? "Tampilkan sebagai" : "Show as"} value={lang === "id" ? "Tumpukan" : "Stack"} chevron compact />
              <ListRow sep label={lang === "id" ? "Suara" : "Sound"} right={<Switch checked={settings.sounds} onChange={(v) => settings.set({ sounds: v })} />} compact />
              <ListRow label={lang === "id" ? "Lencana" : "Badge"} right={<Switch checked onChange={() => void 0} />} compact />
            </ListGroup>
            <ListGroup header={lang === "id" ? "PRATINJAU" : "PREVIEW"}>
              {(["messages", "mail", "appstore"] as const).map((app, i) => (
                <ListRow
                  key={app}
                  sep={i > 0}
                  icon={<AppIconArt id={app} size={26} />}
                  label={t(`app.${app}`)}
                  onClick={() =>
                    useIsland.getState().add({
                      kind: "message",
                      contact: { id: "demo", name: t(`app.${app}`), hue: [330, 210, 45][i], phone: "" },
                      body: lang === "id" ? "Ini pratinjau notifikasi 😉" : "This is a notification preview 😉",
                    })
                  }
                  chevron
                  compact
                />
              ))}
            </ListGroup>
          </Page>
        )}

        {page === "battery" && (
          <Page title={lang === "id" ? "Baterai" : "Battery"} onClose={() => setPage(null)}>
            <ListGroup header={lang === "id" ? "STATUS" : "STATUS"}>
              <ListRow sep label={lang === "id" ? "Level baterai" : "Battery level"} value={`${sys.batteryLevel}%`} compact />
              <ListRow sep label={lang === "id" ? "Mode hemat daya" : "Low Power Mode"} right={<Switch checked={settings.lowPower} onChange={(v) => settings.set({ lowPower: v })} />} compact />
              <ListRow label={lang === "id" ? "Kesehatan baterai" : "Battery health"} value="100%" compact />
            </ListGroup>
            <ListGroup footer={lang === "id" ? "Baterai simulasi terkuras secara otomatis seiring waktu ±1% per 45 detik." : "Simulated battery drains automatically over time, ≈1% per 45 seconds."}>
              <ListRow
                label={sys.charging ? (lang === "id" ? "Cabut pengisi daya" : "Unplug charger") : (lang === "id" ? "Hubungkan pengisi daya" : "Plug in charger")}
                onClick={() => useSystem.setState({ charging: !sys.charging })}
                chevron
                compact
              />
            </ListGroup>
          </Page>
        )}

        {page === "storage" && (
          <Page title={lang === "id" ? "Penyimpanan iPhone" : "iPhone Storage"} onClose={() => setPage(null)}>
            <ListGroup header="1 TB">
              <div style={{ padding: 18 }}>
                <div style={{ height: 12, borderRadius: 6, overflow: "hidden", display: "flex" }}>
                  <span style={{ width: "34%", background: "#ff9f0a" }} />
                  <span style={{ width: "18%", background: "#0a84ff" }} />
                  <span style={{ width: "12%", background: "#30d158" }} />
                  <span style={{ width: "14%", background: "#bf5af2" }} />
                  <span style={{ flex: 1, background: "#3a3a3c" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, fontSize: 14 }}>
                  <span style={{ color: "#ff9f0a" }}>● {lang === "id" ? "Foto" : "Photos"}</span>
                  <span style={{ color: "#0a84ff" }}>● {lang === "id" ? "Aplikasi" : "Apps"}</span>
                  <span style={{ color: "#30d158" }}>● Media</span>
                  <span style={{ color: "#bf5af2" }}>● Sistem</span>
                  <span style={{ opacity: 0.5 }}>{lang === "id" ? "Tersedia" : "Free"}</span>
                </div>
              </div>
            </ListGroup>
            <ListGroup>
              <ListRow icon={<CameraGlyph size={16} />} iconBg="#ff9f0a" label={lang === "id" ? "Foto" : "Photos"} value={`${(usePhotos.getState().photos.length * 0.004).toFixed(2)} GB`} chevron compact />
            </ListGroup>
          </Page>
        )}

        {page === "reset" && (
          <Page title={lang === "id" ? "Reset" : "Reset"} onClose={() => setPage(null)}>
            <ListGroup header={lang === "id" ? "ZONA BERBAHAYA" : "DANGER ZONE"} footer={lang === "id" ? "Menghapus semua pengaturan, foto, pesan, dan data lain yang tersimpan di browser." : "Deletes all settings, photos, messages, and other data stored in the browser."}>
              <ListRow
                label={lang === "id" ? "Hapus Semua Konten & Pengaturan" : "Erase All Content & Settings"}
                onClick={async () => {
                  const r = await showAlert({
                    title: lang === "id" ? "Hapus semua data?" : "Erase all data?",
                    message: lang === "id" ? "Tindakan ini tidak bisa dibatalkan." : "This action cannot be undone.",
                    buttons: [lang === "id" ? "Hapus" : "Erase", t("common.cancel")],
                    cancelIndex: 1,
                  });
                  if (r === 0) {
                    Object.keys(localStorage)
                      .filter((k) => k.startsWith("iphone17") || k.startsWith("ip17-"))
                      .forEach((k) => localStorage.removeItem(k));
                    location.reload();
                  }
                }}
                chevron
                compact
                labelStyle={{ color: "#ff453a" }}
              />
            </ListGroup>
          </Page>
        )}
      </AnimatePresence>
    </div>
  );
}

function Trash({ size = 16, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
      <path d="M4.5 6.5h15M9.5 6V4.4c0-.5.4-.9.9-.9h3.2c.5 0 .9.4.9.9V6" />
      <path d="M6.5 6.5 7.3 19c.1.8.7 1.4 1.5 1.4h6.4c.8 0 1.4-.6 1.5-1.4l.8-12.5" />
    </svg>
  );
}
