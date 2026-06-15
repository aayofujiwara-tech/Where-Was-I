"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { LoginScreen } from "@/components/LoginScreen";
import { getWorks, getProgress, getLatestTicket, getTicketStatus, getChargeCompleteAtMs } from "@/lib/firestore";
import type { WorkWithProgress } from "@/types";
import Link from "next/link";
import Image from "next/image";

export default function WorksPage() {
  const { user, loading } = useAuth();
  const [works, setWorks] = useState<WorkWithProgress[]>([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"updated" | "charge" | "created">("updated");
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setFetching(true);
      try {
        const raw = await getWorks(user.uid);
        const enriched = await Promise.all(
          raw.map(async (w) => {
            const progress = await getProgress(user.uid, w.id);
            const latestTicket = await getLatestTicket(user.uid, w.id);
            const ticketStatus = getTicketStatus(latestTicket);
            const chargeCompleteAtMs = getChargeCompleteAtMs(latestTicket);
            return { ...w, progress, latestTicket, ticketStatus, chargeCompleteAtMs };
          })
        );
        setWorks(enriched as WorkWithProgress[]);
      } finally {
        setFetching(false);
      }
    })();
  }, [user]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">読み込み中...</div>;
  if (!user) return <LoginScreen />;

  const filtered = works
    .filter((w) => w.title.includes(search))
    .sort((a, b) => {
      if (sort === "updated") {
        const at = a.progress?.updated_at?.toMillis() ?? 0;
        const bt = b.progress?.updated_at?.toMillis() ?? 0;
        return bt - at;
      }
      if (sort === "created") {
        return b.created_at.toMillis() - a.created_at.toMillis();
      }
      // charge: ready first, then by remaining time
      if (a.ticketStatus === "ready" && b.ticketStatus !== "ready") return -1;
      if (b.ticketStatus === "ready" && a.ticketStatus !== "ready") return 1;
      return (a.chargeCompleteAtMs ?? Infinity) - (b.chargeCompleteAtMs ?? Infinity);
    });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/" className="text-gray-400 hover:text-gray-600 text-lg">←</Link>
        <h1 className="text-lg font-bold text-gray-900 flex-1">作品一覧</h1>
        <Link
          href="/works/new"
          className="bg-blue-500 text-white text-sm font-bold px-3 py-1.5 rounded-lg hover:bg-blue-600 transition-colors"
        >
          + 追加
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4 space-y-3">
        {/* Search & Sort */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="作品名で検索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as "updated" | "charge" | "created")}
            className="border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none"
          >
            <option value="updated">更新日順</option>
            <option value="created">登録日順</option>
            <option value="charge">チャージ完了順</option>
          </select>
        </div>

        {fetching ? (
          <div className="text-center text-gray-400 py-12">読み込み中...</div>
        ) : filtered.length === 0 && search ? (
          <div className="text-center text-gray-400 py-12">
            「{search}」に一致する作品がありません
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 mb-4">作品がまだ登録されていません</p>
            <Link
              href="/works/new"
              className="bg-blue-500 text-white font-bold px-6 py-3 rounded-xl hover:bg-blue-600 transition-colors"
            >
              最初の作品を追加する
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((w) => (
              <Link
                key={w.id}
                href={`/works/${w.id}`}
                className="block bg-white border border-gray-200 rounded-xl p-3 hover:border-blue-300 transition-colors"
              >
                <div className="flex gap-3 items-center">
                  {/* サムネイル */}
                  {w.cover_image_url ? (
                    <Image
                      src={w.cover_image_url}
                      alt={w.title}
                      width={44}
                      height={58}
                      className="rounded object-cover flex-shrink-0"
                      unoptimized
                    />
                  ) : (
                    <div className="w-11 h-14 bg-gray-100 rounded flex-shrink-0 flex items-center justify-center text-gray-300 text-xs">
                      📖
                    </div>
                  )}

                  {/* 情報 */}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 truncate">{w.title}</div>

                    {/* ジャンルタグ */}
                    {w.genre_tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {w.genre_tags.map((tag) => (
                          <span key={tag} className="bg-gray-100 text-gray-500 text-xs px-1.5 py-0.5 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="text-sm text-gray-500 mt-0.5">
                      {w.progress ? (
                        <>
                          <span className="font-medium text-gray-700">{w.progress.current_episode}話</span>
                          まで読了
                          {w.progress.updated_at && (
                            <span className="text-gray-400 ml-2 text-xs">
                              {w.progress.updated_device} · {w.progress.updated_at.toDate().toLocaleDateString("ja-JP")}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-gray-400">未記録</span>
                      )}
                    </div>
                  </div>

                  {/* チケット状態 */}
                  <div className="flex-shrink-0 text-right text-xs">
                    {w.ticketStatus === "ready" && (
                      <span className="text-green-600 font-bold">✅ 読める</span>
                    )}
                    {w.ticketStatus === "charging" && (
                      <span className="text-gray-400">⏳ チャージ中</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* 件数表示 */}
        {!fetching && filtered.length > 0 && (
          <p className="text-center text-xs text-gray-400 pt-2">
            {filtered.length}件 / 全{works.length}件
          </p>
        )}
      </main>
    </div>
  );
}
