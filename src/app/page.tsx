"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { LoginScreen } from "@/components/LoginScreen";
import { WorkCard } from "@/components/WorkCard";
import { getWorks, getProgress, getLatestTicket, getTicketStatus, getChargeRemainingMs, upsertProgress, useTicket } from "@/lib/firestore";
import { useDevice } from "@/hooks/useDevice";
import type { WorkWithProgress } from "@/types";
import Link from "next/link";

export default function Dashboard() {
  const { user, loading, signOut } = useAuth();
  const device = useDevice();
  const [works, setWorks] = useState<WorkWithProgress[]>([]);
  const [fetching, setFetching] = useState(true);

  const fetchAll = async () => {
    if (!user) return;
    setFetching(true);
    try {
      const rawWorks = await getWorks(user.uid);
      const enriched = await Promise.all(
        rawWorks.map(async (w) => {
          const progress = await getProgress(user.uid, w.id);
          const latestTicket = await getLatestTicket(user.uid, w.id);
          const ticketStatus = getTicketStatus(latestTicket);
          const chargeRemainingMs = getChargeRemainingMs(latestTicket);
          return { ...w, progress, latestTicket, ticketStatus, chargeRemainingMs } as WorkWithProgress;
        })
      );
      enriched.sort((a, b) => {
        if (a.ticketStatus === "ready" && b.ticketStatus !== "ready") return -1;
        if (b.ticketStatus === "ready" && a.ticketStatus !== "ready") return 1;
        if (a.ticketStatus === "charging" && b.ticketStatus === "charging") {
          return (a.chargeRemainingMs ?? 0) - (b.chargeRemainingMs ?? 0);
        }
        return 0;
      });
      setWorks(enriched);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (user) fetchAll();
  }, [user]);

  const handlePlusOne = async (workId: string) => {
    if (!user) return;
    const w = works.find((x) => x.id === workId);
    const current = w?.progress?.current_episode ?? 0;
    await upsertProgress(user.uid, workId, current + 1, w?.progress?.memo ?? "", device);
    await fetchAll();
  };

  const handleUseTicket = async (workId: string) => {
    if (!user) return;
    await useTicket(user.uid, workId);
    await fetchAll();
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">読み込み中...</div>;
  }
  if (!user) return <LoginScreen />;

  const readyWorks = works.filter((w) => w.ticketStatus === "ready");
  const chargingWorks = works.filter((w) => w.ticketStatus === "charging");
  const otherWorks = works.filter((w) => !w.ticketStatus);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-lg font-bold text-gray-900">続きどこ?</h1>
        <div className="flex items-center gap-3">
          <Link href="/works/new" className="bg-blue-500 text-white text-sm font-bold px-3 py-1.5 rounded-lg hover:bg-blue-600 transition-colors">
            + 追加
          </Link>
          <button onClick={signOut} className="text-xs text-gray-400 hover:text-gray-600">ログアウト</button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        {fetching ? (
          <div className="text-center text-gray-400 py-12">読み込み中...</div>
        ) : (
          <>
            {/* Ready section */}
            <section>
              <h2 className="text-base font-bold text-green-700 mb-3">✅ 今すぐ読める ({readyWorks.length})</h2>
              {readyWorks.length === 0 ? (
                <p className="text-sm text-gray-400">チャージ完了の作品はありません</p>
              ) : (
                <div className="space-y-3">
                  {readyWorks.map((w) => (
                    <WorkCard key={w.id} work={w} onPlusOne={handlePlusOne} onUseTicket={handleUseTicket} />
                  ))}
                </div>
              )}
            </section>

            {/* Charging section */}
            {chargingWorks.length > 0 && (
              <section>
                <h2 className="text-base font-bold text-gray-600 mb-3">⏳ チャージ中 ({chargingWorks.length})</h2>
                <div className="space-y-3">
                  {chargingWorks.map((w) => (
                    <WorkCard key={w.id} work={w} onPlusOne={handlePlusOne} onUseTicket={handleUseTicket} />
                  ))}
                </div>
              </section>
            )}

            {/* Other works */}
            {otherWorks.length > 0 && (
              <section>
                <h2 className="text-base font-bold text-gray-500 mb-3">📚 その他の作品 ({otherWorks.length})</h2>
                <div className="space-y-3">
                  {otherWorks.map((w) => (
                    <WorkCard key={w.id} work={w} onPlusOne={handlePlusOne} onUseTicket={handleUseTicket} />
                  ))}
                </div>
              </section>
            )}

            {works.length === 0 && (
              <div className="text-center py-16">
                <p className="text-gray-400 mb-4">作品が登録されていません</p>
                <Link href="/works/new" className="bg-blue-500 text-white font-bold px-6 py-3 rounded-xl hover:bg-blue-600 transition-colors">
                  最初の作品を追加する
                </Link>
              </div>
            )}
          </>
        )}

        {/* Works list link */}
        {works.length > 0 && (
          <div className="text-center pt-4">
            <Link href="/works" className="text-blue-500 hover:underline text-sm">すべての作品を見る →</Link>
          </div>
        )}
      </main>
    </div>
  );
}
