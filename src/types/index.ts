import { Timestamp } from "firebase/firestore";

export interface Work {
  id: string;
  title: string;
  genre_tags: string[];
  piccoma_url: string;
  cover_image_url: string;
  created_at: Timestamp;
  archived: boolean;
}

export interface Progress {
  id: string;
  work_id: string;
  current_episode: number;
  next_episode: number;
  updated_at: Timestamp;
  updated_device: "PC" | "Mobile";
  memo: string;
}

export interface Ticket {
  id: string;
  work_id: string;
  used_at: Timestamp;
  charge_complete_at: Timestamp;
}

export type TicketStatus = "charging" | "ready" | "used_today";

export interface ProgressHistory {
  id: string;
  work_id: string;
  episode: number;
  changed_at: Timestamp;
  device: "PC" | "Mobile";
}

export interface WorkWithProgress extends Work {
  progress: Progress | null;
  latestTicket: Ticket | null;
  ticketStatus: TicketStatus | null;
  chargeRemainingMs: number | null;
}
