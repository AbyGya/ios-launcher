import type { ComponentType } from "react";
import type { AppId } from "../types";
import PhoneApp from "./PhoneApp";
import MessagesApp from "./MessagesApp";
import SafariApp from "./SafariApp";
import CameraApp from "./CameraApp";
import PhotosApp from "./PhotosApp";
import ClockApp from "./ClockApp";
import CalculatorApp from "./CalculatorApp";
import SettingsApp from "./SettingsApp";
import NotesApp from "./NotesApp";
import RemindersApp from "./RemindersApp";
import WeatherApp from "./WeatherApp";
import MapsApp from "./MapsApp";
import CalendarApp from "./CalendarApp";
import MailApp from "./MailApp";
import FilesApp from "./FilesApp";
import VoiceMemosApp from "./VoiceMemosApp";
import WalletApp from "./WalletApp";
import HealthApp from "./HealthApp";
import AppStoreApp from "./AppStoreApp";
import FaceTimeApp from "./FaceTimeApp";
import MusicApp from "./MusicApp";

export interface AppDef {
  id: AppId;
  component: ComponentType;
}

export const APPS: Record<AppId, AppDef> = {
  phone: { id: "phone", component: PhoneApp },
  messages: { id: "messages", component: MessagesApp },
  safari: { id: "safari", component: SafariApp },
  camera: { id: "camera", component: CameraApp },
  photos: { id: "photos", component: PhotosApp },
  clock: { id: "clock", component: ClockApp },
  calculator: { id: "calculator", component: CalculatorApp },
  settings: { id: "settings", component: SettingsApp },
  notes: { id: "notes", component: NotesApp },
  reminders: { id: "reminders", component: RemindersApp },
  weather: { id: "weather", component: WeatherApp },
  maps: { id: "maps", component: MapsApp },
  calendar: { id: "calendar", component: CalendarApp },
  mail: { id: "mail", component: MailApp },
  files: { id: "files", component: FilesApp },
  voicememos: { id: "voicememos", component: VoiceMemosApp },
  wallet: { id: "wallet", component: WalletApp },
  health: { id: "health", component: HealthApp },
  appstore: { id: "appstore", component: AppStoreApp },
  facetime: { id: "facetime", component: FaceTimeApp },
  music: { id: "music", component: MusicApp },
};
