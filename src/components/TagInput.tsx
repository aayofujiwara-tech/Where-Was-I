"use client";
import { useState, useEffect, KeyboardEvent } from "react";
import { getCustomTags, saveCustomTag } from "@/lib/firestore";

const PRESET_TAGS = [
  "異世界", "ファンタジー", "恋愛", "ラブコメ", "バトル", "アクション",
  "日常", "ホラー", "ミステリー", "サスペンス", "SF", "スポーツ",
  "グルメ", "学園", "ヤンキー", "コメディ", "ドラマ", "歴史", "転生", "シリアス",
];

const MAX_TAG_LENGTH = 30;
const MAX_TAG_COUNT = 10;

interface Props {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  userId?: string;
}

export function TagInput({ tags, onChange, placeholder = "タグを入力してEnter", userId }: Props) {
  const [input, setInput] = useState("");
  const [userTags, setUserTags] = useState<string[]>([]);

  useEffect(() => {
    if (!userId) return;
    getCustomTags(userId).then(setUserTags).catch(() => {});
  }, [userId]);

  const toggle = (tag: string) => {
    if (tags.includes(tag)) {
      onChange(tags.filter((t) => t !== tag));
    } else if (tags.length < MAX_TAG_COUNT) {
      onChange([...tags, tag]);
    }
  };

  const add = async () => {
    const val = input.trim().slice(0, MAX_TAG_LENGTH);
    setInput("");
    if (!val || tags.includes(val) || tags.length >= MAX_TAG_COUNT) return;
    onChange([...tags, val]);
    if (userId && !PRESET_TAGS.includes(val) && !userTags.includes(val)) {
      try {
        await saveCustomTag(userId, val);
        setUserTags((prev) => [...prev, val]);
      } catch {}
    }
  };

  const remove = (tag: string) => onChange(tags.filter((t) => t !== tag));

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); add(); }
    if (e.key === "Backspace" && input === "" && tags.length > 0) {
      remove(tags[tags.length - 1]);
    }
  };

  // プリセットに含まれないユーザー独自タグのみ表示
  const userOnlyTags = userTags.filter((t) => !PRESET_TAGS.includes(t));
  const full = tags.length >= MAX_TAG_COUNT;

  const Chip = ({ tag }: { tag: string }) => {
    const selected = tags.includes(tag);
    return (
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()} // inputのblurを阻止
        onClick={() => toggle(tag)}
        disabled={!selected && full}
        className={`text-xs font-medium px-2.5 py-1.5 rounded-full transition-colors ${
          selected
            ? "bg-blue-500 text-white"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
        }`}
      >
        {tag}
      </button>
    );
  };

  return (
    <div className="space-y-3">
      {/* 選択済みタグ + フリー入力 */}
      <div className="flex flex-wrap gap-1.5 border border-gray-300 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-blue-400 bg-white min-h-[42px]">
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded-full"
          >
            {tag}
            <button
              type="button"
              onClick={() => remove(tag)}
              className="hover:text-blue-900 leading-none"
            >
              ×
            </button>
          </span>
        ))}
        {!full && (
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            onBlur={add}
            placeholder={tags.length === 0 ? placeholder : ""}
            maxLength={MAX_TAG_LENGTH}
            className="flex-1 min-w-[120px] text-sm outline-none bg-transparent"
          />
        )}
      </div>

      {full && (
        <p className="text-xs text-gray-400">タグは最大{MAX_TAG_COUNT}個まで追加できます</p>
      )}

      {/* よく使うタグ */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-gray-400">よく使うタグ</p>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_TAGS.map((tag) => <Chip key={tag} tag={tag} />)}
        </div>
      </div>

      {/* 自分のタグ */}
      {userOnlyTags.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-gray-400">自分のタグ</p>
          <div className="flex flex-wrap gap-1.5">
            {userOnlyTags.map((tag) => <Chip key={tag} tag={tag} />)}
          </div>
        </div>
      )}
    </div>
  );
}
