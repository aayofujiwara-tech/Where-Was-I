"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { LoginScreen } from "@/components/LoginScreen";
import {
  getWorks, getProgress, getLatestTicket, getTicketStatus, getChargeCompleteAtMs,
  upsertProgress, useTicket, archiveWork, getProgressHistory
} from "@/lib/firestore";
import type { Work, Progress, Ticket, ProgressHistory } from "@/types";
import { useDevice } from "@/hooks/useDevice";
import { useCountdown } from "@/hooks/useCountdown";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

export default function WorkDetailPage() {
  const { user, loading } = useAuth();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const device = useDevice();

  const [work, setWork] = useState<Work | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [history, setHistory] = useState<ProgressHistory[]>([]);
  const [episodeInput, setEpisodeInput] = useState("");
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);

  const serverTicketStatus = getTicketStatus(ticket);
  const chargeCompleteAtMs = getChargeCompleteAtMs(ticket);
  const { text: countdownText, done: chargeDone } = useCountdown(chargeCompleteAtMs);

  const isReady = serverTicketStatus === "ready" || chargeDone;
  const isCharging = serverTicketStatus === "charging" && !chargeDone;
  const hasTicket = ticket !== null;

  const fetchData = async () => {
    if (!user) return;
    const works = await getWorks(user.uid);
    const found = works.find((w) => w.id === id) ?? null;
    setWork(found);
    const prog = await getProgress(user.uid, id);
    setProgress(prog);
    if (prog) { setEpisodeInput(String(prog.current_episode)); setMemo(prog.memo ?? ""); }
    const tick = await getLatestTicket(user.uid, id);
    setTicket(tick);
    const hist = await getProgressHistory(user.uid, id);
    setHistory(hist);
  };

  useEffect(() => { if (user) fetchData(); }, [user, id]);

  const handleSaveProgress = async () => {
    if (!user || !episodeInput) return;
    setSaving(true);
    try {
      await upsertProgress(user.uid, id, parseInt(episodeInput, 10), memo, device);
      await fetchData();
    } finally {
      setSaving(false);
    }
  };

  const handleUseTicket = async () => {
    if (!user) return;
    await useTicket(user.uid, id);
    await fetchData();
  };

  const handleArchive = async () => {
    if (!user || !confirm("この作品をアーカイブしますか?")) return;
    await archiveWork(user.uid, id);
    router.push("/works");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">読み込み中...</div>;
  if (!user) return <LoginScreen />;
  if (!work) return <div className="min-h-screen flex items-center justify-center text-gray-400">作品が見つかりません</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/" className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-base font-bold text-gray-900 flex-1 truncate">{work.title}</h1>
        <Link href={`/works/${id}/edit`} className="text-sm text-blue-500 hover:underline">編集</Link>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {work.piccoma_url && (
          <a href={work.piccoma_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 text-sm hover:underline">
            ピッコマで開く →
          </a>
        )}
        {work.genre_tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {work.genre_tags.map((t) => (
              <span key={t} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{t}</span>
            ))}
          </div>
        )}

        <section className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <h2 className="font-bold text-gray-800">進捗</h2>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">現在の既読話数</label>
              <input
                type="number"
                value={episodeInput}
                onChange={(e) => setEpisodeInput(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                min={0}
              />
            </div>
            <button
              onClick={handleSaveProgress}
              disabled={saving}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors disabled:opacity-50"
            >
              {saving ? "保存中..." : "保存"}
            </button>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">メモ</label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={2}
              placeholder="例: ここから話が動く"
              className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            />
          </div>
          {progress && (
            <p className="text-xs text-gray-400">
              最終更新: {progress.updated_device} · {progress.updated_at.toDate().toLocaleString("ja-JP")}
            </p>
          )}
        </section>

        <section className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <h2 className="font-bold text-gray-800">待てば0円</h2>
          {serverTicketStatus === "ready" && (
            <div className="bg-green-100 text-green-700 font-bold text-sm px-4 py-2 rounded-xl text-center">
              ✅ チャージ完了！今すぐ読めます
            </div>
          )}
          {serverTicketStatus === "charging" && (
            <div className="bg-gray-100 text-gray-600 text-sm px-4 py-2 rounded-xl text-center">
              ⏳ チャージ中: 残り {countdownText}
            </div>
          )}
          {!hasTicket && (
            <p className="text-sm text-gray-400">まだ待てば0円を使っていません</p>
          )}
          <button
            onClick={handleUseTicket}
            className="w-full bg-orange-400 hover:bg-orange-500 text-white font-bold py-2 rounded-xl text-sm transition-colors"
          >
            待てば0円を使った
          </button>
        </section>

        {history.length > 0 && (
          <section className="bg-white rounded-2xl p-4 shadow-sm space-y-2">
            <h2 className="font-bold text-gray-800">更新履歴</h2>
            <ul className="space-y-1.5">
              {history.slice(0, 10).map((h) => (
                <li key={h.id} className="flex justify-between text-sm text-gray-600">
                  <span>{h.episode}話</span>
                  <span className="text-gray-400 text-xs">
                    {h.device} · {h.changed_at.toDate().toLocaleString("ja-JP")}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="pt-4">
          <button
            onClick={handleArchive}
            className="w-full border border-gray-300 text-gray-500 hover:bg-gray-100 py-2 rounded-xl text-sm transition-colors"
          >
            この作品をアーカイブ（完読・追跡終了）
          </button>
        </div>
      </main>
    </div>
  );
}
