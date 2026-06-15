"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { WorkWithProgress } from "@/types";
import { useCountdown } from "@/hooks/useCountdown";

interface Props {
  work: WorkWithProgress;
  onPlusOne: (workId: string) => Promise<void>;
  onPlusSeven: (workId: string) => Promise<void>;
  onUseTicket: (workId: string) => Promise<void>;
}

export function WorkCard({ work, onPlusOne, onPlusSeven, onUseTicket }: Props) {
  const [busy, setBusy] = useState(false);
  const { text: countdownText, done: chargeDone } = useCountdown(work.chargeCompleteAtMs);

  const isReady = work.ticketStatus === "ready" || chargeDone;
  const isCharging = work.ticketStatus === "charging" && !chargeDone;

  const handle = async (fn: (id: string) => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    try { await fn(work.id); } finally { setBusy(false); }
  };

  return (
    <div className={`rounded-2xl p-4 shadow-md flex flex-col gap-3 ${
      isReady ? "bg-green-50 border border-green-300"
      : isCharging ? "bg-gray-50 border border-gray-200"
      : "bg-white border border-gray-200"
    }`}>
      <div className="flex gap-3 items-start">
        {work.cover_image_url ? (
          <Image
            src={work.cover_image_url}
            alt={work.title}
            width={60}
            height={80}
            className="rounded object-cover flex-shrink-0"
            unoptimized
          />
        ) : (
          <div className="w-[60px] h-[80px] bg-gray-200 rounded flex items-center justify-center text-gray-300 text-2xl flex-shrink-0">
            📖
          </div>
        )}
        <div className="flex-1 min-w-0">
          <Link href={`/works/${work.id}`} className="font-bold text-gray-900 hover:underline line-clamp-2 leading-snug">
            {work.title}
          </Link>
          {work.piccoma_url && (
            <a href={work.piccoma_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline block truncate">
              ピッコマで開く →
            </a>
          )}
          <div className="mt-1 text-sm text-gray-600">
            {work.progress ? (
              <>
                <span className="font-medium">{work.progress.current_episode}話</span>まで読了
                <span className="ml-2 text-gray-400">次: {work.progress.next_episode}話</span>
              </>
            ) : (
              <span className="text-gray-400">未記録</span>
            )}
          </div>
          {work.progress?.updated_at && (
            <div className="text-xs text-gray-400">
              {work.progress.updated_device} · {work.progress.updated_at.toDate().toLocaleDateString("ja-JP")}
            </div>
          )}
        </div>
      </div>

      {isReady && (
        <div className="bg-green-100 text-green-700 text-sm font-bold px-3 py-2 rounded-xl text-center">
          ✅ 待てば0円 今すぐ読めます！
        </div>
      )}
      {isCharging && (
        <div className="bg-gray-100 text-gray-500 text-sm px-3 py-2 rounded-xl text-center">
          ⏳ チャージ中: 残り {countdownText}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <button
            onClick={() => handle(onPlusOne)}
            disabled={busy}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-3 rounded-xl text-sm transition-colors disabled:opacity-50"
          >
            +1話進める
          </button>
          <button
            onClick={() => handle(onPlusSeven)}
            disabled={busy}
            className="flex-1 bg-blue-400 hover:bg-blue-500 text-white font-bold py-3 px-3 rounded-xl text-sm transition-colors disabled:opacity-50"
          >
            +7話進める
          </button>
        </div>
        <button
          onClick={() => handle(onUseTicket)}
          disabled={busy}
          className="w-full bg-orange-400 hover:bg-orange-500 text-white font-bold py-3 rounded-xl text-sm transition-colors disabled:opacity-50"
        >
          {busy ? "処理中..." : "待てば0円 使った"}
        </button>
      </div>
    </div>
  );
}
