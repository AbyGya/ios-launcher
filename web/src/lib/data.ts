import type { Contact } from "../types";

export const CONTACTS: Contact[] = [
  { id: "maya", name: "Maya Anggraini", hue: 330, phone: "0812-3456-7801" },
  { id: "budi", name: "Budi Santoso", hue: 210, phone: "0812-3456-7802" },
  { id: "rina", name: "Rina Kusuma", hue: 150, phone: "0812-3456-7803" },
  { id: "dimas", name: "Dimas Prasetyo", hue: 30, phone: "0812-3456-7804" },
  { id: "sari", name: "Sari Wulandari", hue: 280, phone: "0812-3456-7805" },
  { id: "agus", name: "Agus Setiawan", hue: 190, phone: "0812-3456-7806" },
  { id: "dewi", name: "Dewi Lestari", hue: 0, phone: "0812-3456-7807" },
  { id: "eko", name: "Eko Wijaya", hue: 100, phone: "0812-3456-7808" },
  { id: "ibu", name: "Ibu", hue: 20, phone: "0812-3456-7809" },
  { id: "pak", name: "Ayah", hue: 240, phone: "0812-3456-7810" },
];

export const AUTO_REPLIES_ID = [
  "Oke siap! 👍",
  "Wkwk bisa aja 😂",
  "Nanti aku kabari lagi ya",
  "Lagi di jalan nih, 10 menit lagi sampai",
  "Boleh banget! Jam berapa?",
  "Hahah iya bener banget",
  "Fiks, kita atur besok ya",
  "Makasih ya udah bantu 🙏",
];

export const AUTO_REPLIES_EN = [
  "Okay sure! 👍",
  "Haha you're funny 😂",
  "I'll let you know later",
  "On my way, 10 mins away",
  "Sure! What time?",
  "Haha so true",
  "Alright, let's sort it out tomorrow",
  "Thanks for the help 🙏",
];

export interface MailItem {
  id: string;
  from: string;
  name: string;
  subject: string;
  preview: string;
  body: string[];
  time: string;
  unread: boolean;
  hue: number;
  vip?: boolean;
}

export const MAILS: MailItem[] = [
  {
    id: "m1",
    from: "halo@tokonusantara.id",
    name: "Toko Nusantara",
    subject: "Pesananmu sedang dikirim 🚚",
    preview: "Pesanan #INV-2026-8812 sudah diserahkan ke kurir...",
    body: [
      "Halo Abi,",
      "Kabar baik! Pesanan #INV-2026-8812 (Keyboard Mekanik 65%) sudah diserahkan ke kurir Jajan Express dan diperkirakan tiba hari ini sebelum pukul 17.00.",
      "Kamu bisa melacak posisi kurir lewat aplikasi Peta di iPhone-mu.",
      "Selamat menggunakan produk barumu!",
      "Salam,\nTim Toko Nusantara",
    ],
    time: "09.12",
    unread: true,
    hue: 20,
  },
  {
    id: "m2",
    from: "noreply@banknusa.co.id",
    name: "Bank Nusa",
    subject: "E-Statement Kartu Kredit Agustus 2026",
    preview: "Total tagihan bulan ini Rp2.847.500 dengan jatuh tempo...",
    body: [
      "Yth. Abi Gunawan,",
      "E-statement kartu kredit Anda untuk periode Agustus 2026 telah tersedia.",
      "Total tagihan: Rp2.847.500\nJatuh tempo: 5 November 2026\nMinimum pembayaran: Rp284.750",
      "Bayar tepat waktu untuk menghindari bunga dan menjaga skor kredit Anda.",
      "Bank Nusa — Melayani dengan hati",
    ],
    time: "07.45",
    unread: true,
    hue: 210,
    vip: true,
  },
  {
    id: "m3",
    from: "tim@desainkita.id",
    name: "Tim Desain Kita",
    subject: "Re: Review desain aplikasi v2.3",
    preview: "Masukan dari klien sudah aku gabungkan ke file Figma...",
    body: [
      "Hai Abi,",
      "Masukan dari klien pada sesi review kemarin sudah aku gabungkan ke file Figma. Yang berubah:",
      "• Warna primary diganti jadi oranye kosmik\n• Ikon di tab bar dibuat lebih besar 10%\n• Animasi transisi menggunakan spring 320",
      "Boleh dicek dulu, besok pagi kita bahas singkat ya.",
      "— Sari",
    ],
    time: "Kemarin",
    unread: false,
    hue: 280,
  },
  {
    id: "m4",
    from: "newsletter@rasanusa.id",
    name: "Rasa Nusantara",
    subject: "Album baru: Fajar 🌅",
    preview: "Playlist teman kerja sudah rilis, cocok untuk pagi...",
    body: [
      "Halo pecinta musik,",
      "Album 'Fajar' dari Gema Pulau kini bisa didengarkan di Apple Music.",
      "Delapan lagu dengan nuansa alam Nusantara, direkam langsung di kaki Gunung Rinjani.",
      "Dengarkan sekarang dan tambahkan ke koleksimu.",
    ],
    time: "Kemarin",
    unread: false,
    hue: 140,
  },
];

export interface NoteItem {
  id: string;
  title: string;
  body: string;
  ts: number;
}

export interface ReminderItem {
  id: string;
  title: string;
  done: boolean;
  list: string;
  due?: string;
}

export const DEFAULT_REMINDERS: ReminderItem[] = [
  { id: "r1", title: "Beli kopi arabika", done: false, list: "Belanja", due: "Hari ini" },
  { id: "r2", title: "Bayar tagihan listrik", done: false, list: "Keuangan", due: "Besok" },
  { id: "r3", title: "Review desain v2.3", done: false, list: "Kerja", due: "Hari ini" },
  { id: "r4", title: "Telepon ibu", done: true, list: "Pribadi" },
  { id: "r5", title: "Booking lapangan futsal", done: false, list: "Olahraga", due: "Sabtu" },
];

export interface EventItem {
  id: string;
  title: string;
  date: string;
  time?: string;
  hue: number;
  location?: string;
}

export const EVENTS: EventItem[] = [
  { id: "e1", title: "Standup Produk", date: todayISO(0), time: "09.00", hue: 350, location: "Zoom" },
  { id: "e2", title: "Makan siang tim", date: todayISO(0), time: "12.30", hue: 30, location: "Sate Senayan" },
  { id: "e3", title: "Review desain v2.3", date: todayISO(0), time: "15.00", hue: 280, location: "Kantor" },
  { id: "e4", title: "Gym", date: todayISO(0), time: "19.00", hue: 140, location: "FitPlus" },
  { id: "e5", title: "Dentist", date: todayISO(2), time: "10.00", hue: 200, location: "Klinik Sehat" },
  { id: "e6", title: "Ulang tahun Rina", date: todayISO(4), hue: 330 },
];

export function todayISO(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export interface WalletTx {
  id: string;
  title: string;
  place: string;
  amount: number;
  ts: number;
  hue: number;
}

export const WALLET_TXS: WalletTx[] = [
  { id: "t1", title: "Jajan Express", place: "Kopi Kenangan", amount: -22000, ts: Date.now() - 3600_000, hue: 20 },
  { id: "t2", title: "Top Up Gopay", place: "BCA", amount: 250000, ts: Date.now() - 86400_000, hue: 210 },
  { id: "t3", title: "Netflix", place: "Langganan", amount: -186000, ts: Date.now() - 2 * 86400_000, hue: 350 },
  { id: "t4", title: "Gaji Oktober", place: "Transfer masuk", amount: 12500000, ts: Date.now() - 3 * 86400_000, hue: 140 },
  { id: "t5", title: "SPBU Pertamina", place: "Pertalite", amount: -150000, ts: Date.now() - 4 * 86400_000, hue: 30 },
];

export const WEATHER_CITIES = [
  { name: "Jakarta", temp: 31, cond: "Cerah Berawan", icon: "⛅", low: 26, high: 33, humidity: 72, wind: 12 },
  { name: "Bandung", temp: 24, cond: "Hujan Ringan", icon: "🌧️", low: 19, high: 27, humidity: 84, wind: 8 },
  { name: "Bali", temp: 29, cond: "Cerah", icon: "☀️", low: 25, high: 31, humidity: 65, wind: 15 },
  { name: "Yogyakarta", temp: 28, cond: "Berawan", icon: "⛅", low: 24, high: 30, humidity: 70, wind: 10 },
  { name: "Medan", temp: 30, cond: "Hujan Petir", icon: "⛈️", low: 25, high: 32, humidity: 88, wind: 9 },
];

export interface MapPlace {
  id: string;
  name: string;
  category: string;
  x: number;
  y: number;
  rating: number;
  distance: string;
}

export const MAP_PLACES: MapPlace[] = [
  { id: "p1", name: "Kopi Senja", category: "Kafe", x: 32, y: 38, rating: 4.8, distance: "350 m" },
  { id: "p2", name: "Sate Senayan", category: "Restoran", x: 62, y: 30, rating: 4.7, distance: "1,2 km" },
  { id: "p3", name: "Monas", category: "Landmark", x: 50, y: 55, rating: 4.9, distance: "2,4 km" },
  { id: "p4", name: "FitPlus Gym", category: "Olahraga", x: 24, y: 66, rating: 4.5, distance: "800 m" },
  { id: "p5", name: "Taman Suropati", category: "Taman", x: 74, y: 64, rating: 4.6, distance: "1,8 km" },
];
