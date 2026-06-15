"use client";
import { useEffect, useState } from "react";

export function useCountdown(targetMs: number | null): string {
  const [display, setDisplay] = useState("");

  useEffect(() => {
    if (targetMs === null) { setDisplay(""); return; }

    const update = () => {
      const remaining = targetMs - Date.now();
      if (remaining <= 0) { setDisplay("完了"); return; }
      const h = Math.floor(remaining / 3600000);
      const m = Math.floor((remaining % 3600000) / 60000);
      const s = Math.floor((remaining % 60000) / 1000);
      setDisplay(`${h}時間${m}分${s}秒`);
    };

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [targetMs]);

  return display;
}
