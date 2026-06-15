"use client";
import { useState, KeyboardEvent } from "react";

const MAX_TAG_LENGTH = 30;
const MAX_TAG_COUNT = 10;

interface Props {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export function TagInput({ tags, onChange, placeholder = "タグを入力してEnter" }: Props) {
  const [input, setInput] = useState("");

  const add = () => {
    const val = input.trim().slice(0, MAX_TAG_LENGTH);
    if (val && !tags.includes(val) && tags.length < MAX_TAG_COUNT) {
      onChange([...tags, val]);
    }
    setInput("");
  };

  const remove = (tag: string) => onChange(tags.filter((t) => t !== tag));

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); add(); }
    if (e.key === "Backspace" && input === "" && tags.length > 0) {
      remove(tags[tags.length - 1]);
    }
  };

  return (
    <div className="flex flex-wrap gap-1.5 border border-gray-300 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-blue-400 bg-white min-h-[42px]">
      {tags.map((tag) => (
        <span key={tag} className="flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded-full">
          {tag}
          <button type="button" onClick={() => remove(tag)} className="hover:text-blue-900 leading-none">×</button>
        </span>
      ))}
      {tags.length < MAX_TAG_COUNT && (
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
  );
}
