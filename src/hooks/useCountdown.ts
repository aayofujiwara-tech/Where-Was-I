"use client";
import { useEffect, useState } from "react";

interface CountdownResult {
  text: string;
  done: boolean;
}

export function useCountdown(chargeCompleteAtMs: number | null): CountdownResult {
  const [result, setResult] = useState<CountdownResult>({ text: "", done: false });

  useEffect(() => {
    if (chargeCompleteAtMs === null) {
      setResult({ text: "", done: false });
      return;
    }

    const update = () => {
      const remaining = chargeCompleteAtMs - Date.now();
      if (remaining <= 0) {
        setResult({ text: "", done: true });
        return;
      }
      const h = Math.floor(remaining / 3600000);
      const m = Math.floor((remaining % 3600000) / 60000);
      const text = h > 0 ? `${h}時間${m}分` : `${m}分`;
      setResult({ text, done: false });
    };

    update();
    const id = setInterval(update, 60000); // 1分ごとに更新
    return () => clearInterval(id);
  }, [chargeCompleteAtMs]);

  return result;
}
