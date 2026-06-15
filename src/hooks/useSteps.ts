"use client";
import { useState, useEffect } from "react";
import { getSteps, updateSteps } from "@/lib/firestore";

const DEFAULT_STEPS: [number, number, number] = [1, 7, 3];

export function useSteps(userId: string | null) {
  const [steps, setSteps] = useState<[number, number, number]>(DEFAULT_STEPS);

  useEffect(() => {
    if (!userId) return;
    getSteps(userId).then(setSteps).catch(() => {});
  }, [userId]);

  const updateStep = async (index: 0 | 1 | 2, value: number) => {
    if (!userId || value < 1 || value > 999) return;
    const next: [number, number, number] = [steps[0], steps[1], steps[2]];
    next[index] = value;
    setSteps(next);
    try {
      await updateSteps(userId, next);
    } catch {
      setSteps(steps);
    }
  };

  return { steps, updateStep };
}
