export type AppId =
  | "phone"
  | "messages"
  | "safari"
  | "camera"
  | "photos"
  | "clock"
  | "calculator"
  | "settings"
  | "notes"
  | "reminders"
  | "weather"
  | "maps"
  | "calendar"
  | "mail"
  | "files"
  | "voicememos"
  | "wallet"
  | "health"
  | "appstore"
  | "facetime"
  | "music";

export interface Contact {
  id: string;
  name: string;
  hue: number;
  phone: string;
}

export interface NotifItem {
  id: string;
  app: AppId;
  title: string;
  body: string;
  time: number;
  kind?: string;
  payload?: Record<string, unknown>;
}

export type ActivityKind =
  | "call"
  | "facetime"
  | "timer"
  | "stopwatch"
  | "music"
  | "recording"
  | "charging"
  | "airdrop"
  | "delivery"
  | "message"
  | "faceid"
  | "alarm";

export interface Activity {
  id: string;
  kind: ActivityKind;
  createdAt: number;
  contact?: Contact;
  title?: string;
  label?: string;
  body?: string;
  state?: string;
  startedAt?: number;
  endsAt?: number;
  pausedRemaining?: number;
  total?: number;
  progress?: number;
  status?: number;
  muted?: boolean;
  cameraOn?: boolean;
}
