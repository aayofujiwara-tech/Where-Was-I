import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  query,
  where,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Work, Progress, Ticket, ProgressHistory } from "@/types";

// ── Works ────────────────────────────────────────────────────────────
export async function getWorks(userId: string): Promise<Work[]> {
  // where のみ（orderBy を外してコンポジットインデックス不要に）
  const snap = await getDocs(
    query(
      collection(db, "users", userId, "works"),
      where("archived", "==", false)
    )
  );
  const works = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Work));
  // クライアントサイドで created_at 降順ソート
  return works.sort(
    (a, b) => b.created_at.toMillis() - a.created_at.toMillis()
  );
}

export async function addWork(
  userId: string,
  data: Omit<Work, "id" | "created_at">
): Promise<string> {
  const ref = await addDoc(collection(db, "users", userId, "works"), {
    ...data,
    created_at: serverTimestamp(),
  });
  return ref.id;
}

export async function updateWork(
  userId: string,
  workId: string,
  data: Partial<Omit<Work, "id">>
): Promise<void> {
  await updateDoc(doc(db, "users", userId, "works", workId), data);
}

export async function archiveWork(userId: string, workId: string): Promise<void> {
  await updateDoc(doc(db, "users", userId, "works", workId), { archived: true });
}

// ── Progress ──────────────────────────────────────────────────────────
export async function getProgress(userId: string, workId: string): Promise<Progress | null> {
  const snap = await getDocs(
    query(collection(db, "users", userId, "progress"), where("work_id", "==", workId))
  );
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as Progress;
}

export async function upsertProgress(
  userId: string,
  workId: string,
  current_episode: number,
  memo: string,
  device: "PC" | "Mobile"
): Promise<void> {
  const existing = await getProgress(userId, workId);
  const data = {
    work_id: workId,
    current_episode,
    next_episode: current_episode + 1,
    updated_at: serverTimestamp(),
    updated_device: device,
    memo,
  };
  if (existing) {
    await updateDoc(doc(db, "users", userId, "progress", existing.id), data);
  } else {
    await addDoc(collection(db, "users", userId, "progress"), data);
  }
  await addDoc(collection(db, "users", userId, "progress_history"), {
    work_id: workId,
    episode: current_episode,
    changed_at: serverTimestamp(),
    device,
  });
}

// ── Tickets ───────────────────────────────────────────────────────────
export async function getLatestTicket(userId: string, workId: string): Promise<Ticket | null> {
  // orderBy を外してコンポジットインデックス不要に、クライアントでソート
  const snap = await getDocs(
    query(collection(db, "users", userId, "tickets"), where("work_id", "==", workId))
  );
  if (snap.empty) return null;
  const tickets = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Ticket));
  // used_at 降順で最新を取得
  tickets.sort((a, b) => b.used_at.toMillis() - a.used_at.toMillis());
  return tickets[0];
}

export async function useTicket(userId: string, workId: string): Promise<void> {
  const used_at = Timestamp.now();
  const charge_complete_at = Timestamp.fromMillis(used_at.toMillis() + 23 * 60 * 60 * 1000);
  await addDoc(collection(db, "users", userId, "tickets"), {
    work_id: workId,
    used_at,
    charge_complete_at,
  });
}

export function getTicketStatus(ticket: Ticket | null): "ready" | "charging" | null {
  if (!ticket) return null;
  return ticket.charge_complete_at.toMillis() <= Date.now() ? "ready" : "charging";
}

export function getChargeCompleteAtMs(ticket: Ticket | null): number | null {
  if (!ticket) return null;
  return ticket.charge_complete_at.toMillis();
}

// ── History ───────────────────────────────────────────────────────────
export async function getProgressHistory(
  userId: string,
  workId: string
): Promise<ProgressHistory[]> {
  // orderBy を外してコンポジットインデックス不要に、クライアントでソート
  const snap = await getDocs(
    query(
      collection(db, "users", userId, "progress_history"),
      where("work_id", "==", workId)
    )
  );
  const history = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ProgressHistory));
  return history.sort((a, b) => b.changed_at.toMillis() - a.changed_at.toMillis());
}
