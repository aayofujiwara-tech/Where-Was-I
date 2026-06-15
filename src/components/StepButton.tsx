"use client";
import { useState } from "react";

interface Props {
  index: 0 | 1 | 2;
  step: number;
  busy: boolean;
  onAdvance: () => void;
  onUpdateStep: (index: 0 | 1 | 2, value: number) => Promise<void>;
}

export function StepButton({ index, step, busy, onAdvance, onUpdateStep }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(step));

  const openEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDraft(String(step));
    setEditing(true);
  };

  const save = async () => {
    const n = parseInt(draft, 10);
    if (!isNaN(n) && n >= 1 && n <= 999 && n !== step) {
      await onUpdateStep(index, n);
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-blue-50 border-2 border-blue-400 rounded-xl py-2 min-h-[52px]">
        <div className="flex items-center gap-0.5">
          <span className="text-blue-600 text-base font-bold">+</span>
          <input
            type="number"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={save}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); save(); }
              if (e.key === "Escape") setEditing(false);
            }}
            className="w-12 text-base text-center font-bold text-blue-600 bg-transparent outline-none border-b-2 border-blue-400"
            min={1}
            max={999}
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
          <span className="text-blue-600 text-base font-bold">話</span>
        </div>
        <span className="text-xs text-blue-400 mt-0.5">Enterで確定</span>
      </div>
    );
  }

  return (
    <button
      onClick={() => { if (!busy) onAdvance(); }}
      className={`flex-1 flex flex-col items-center justify-center bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-bold rounded-xl transition-colors min-h-[52px] py-2 px-1 ${busy ? "opacity-50" : ""}`}
    >
      <span className="text-base leading-tight">
        +<span
          onClick={openEdit}
          className="underline decoration-dotted underline-offset-2 cursor-text"
          title="タップして数値を変更"
        >{step}</span>話
      </span>
      <span className="text-xs font-normal opacity-80 leading-tight">進める</span>
    </button>
  );
}
