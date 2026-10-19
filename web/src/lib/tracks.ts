export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  hue: number;
  hue2: number;
  bpm: number;
  duration: number;
  chords: number[][];
  bass: number[];
  mood: "lofi" | "synth" | "chill" | "dream" | "world" | "jazz";
}

export const TRACKS: Track[] = [
  {
    id: "senja",
    title: "Senja di Jakarta",
    artist: "Rasa Nusantara",
    album: "Kota Cahaya",
    hue: 24,
    hue2: 340,
    bpm: 74,
    duration: 204,
    chords: [
      [57, 60, 64, 67],
      [53, 57, 60, 64],
      [55, 59, 62, 65],
      [52, 55, 59, 62],
    ],
    bass: [45, 41, 43, 40],
    mood: "lofi",
  },
  {
    id: "hujan",
    title: "Hujan Bulan Juni",
    artist: "Kenangan",
    album: "Hujan & Kenangan",
    hue: 208,
    hue2: 250,
    bpm: 62,
    duration: 232,
    chords: [
      [60, 64, 67, 72],
      [57, 60, 64, 69],
      [65, 69, 72, 76],
      [62, 65, 69, 74],
    ],
    bass: [48, 45, 53, 50],
    mood: "dream",
  },
  {
    id: "kuta",
    title: "Pantai Kuta",
    artist: "Laut Selatan",
    album: "Kota Cahaya",
    hue: 192,
    hue2: 160,
    bpm: 86,
    duration: 188,
    chords: [
      [62, 65, 69, 74],
      [60, 64, 67, 72],
      [57, 60, 64, 69],
      [59, 62, 66, 71],
    ],
    bass: [50, 48, 45, 47],
    mood: "chill",
  },
  {
    id: "malam",
    title: "Malam Minggu",
    artist: "Neon Kota",
    album: "Kota Cahaya",
    hue: 288,
    hue2: 320,
    bpm: 102,
    duration: 216,
    chords: [
      [57, 60, 64, 69],
      [60, 63, 67, 72],
      [55, 58, 62, 67],
      [53, 57, 60, 65],
    ],
    bass: [45, 48, 43, 41],
    mood: "synth",
  },
  {
    id: "nusantara",
    title: "Nusantara",
    artist: "Gema Pulau",
    album: "Rasa Nusantara",
    hue: 140,
    hue2: 80,
    bpm: 92,
    duration: 240,
    chords: [
      [60, 62, 65, 69],
      [55, 59, 62, 67],
      [57, 60, 64, 69],
      [53, 55, 60, 64],
    ],
    bass: [48, 43, 45, 41],
    mood: "world",
  },
  {
    id: "bintang",
    title: "Bintang Jatuh",
    artist: "Kenangan",
    album: "Hujan & Kenangan",
    hue: 332,
    hue2: 280,
    bpm: 78,
    duration: 196,
    chords: [
      [53, 57, 60, 65],
      [60, 64, 67, 72],
      [58, 62, 65, 70],
      [55, 59, 62, 67],
    ],
    bass: [41, 48, 46, 43],
    mood: "dream",
  },
  {
    id: "kopi",
    title: "Kopi Pagi",
    artist: "Rasa Nusantara",
    album: "Rasa Nusantara",
    hue: 40,
    hue2: 20,
    bpm: 88,
    duration: 176,
    chords: [
      [60, 63, 67, 70],
      [65, 69, 72, 76],
      [62, 65, 69, 72],
      [67, 70, 74, 77],
    ],
    bass: [48, 53, 50, 55],
    mood: "jazz",
  },
  {
    id: "rinjani",
    title: "Gunung Rinjani",
    artist: "Gema Pulau",
    album: "Fajar",
    hue: 252,
    hue2: 200,
    bpm: 68,
    duration: 256,
    chords: [
      [55, 59, 62, 67],
      [53, 57, 60, 65],
      [50, 53, 57, 60],
      [48, 52, 55, 60],
    ],
    bass: [43, 41, 38, 36],
    mood: "world",
  },
];

export const ALBUMS = [
  { name: "Kota Cahaya", hue: 20, hue2: 320 },
  { name: "Hujan & Kenangan", hue: 210, hue2: 260 },
  { name: "Rasa Nusantara", hue: 140, hue2: 40 },
  { name: "Fajar", hue: 250, hue2: 180 },
];
