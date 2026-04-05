"use client";

import { useState, useCallback } from "react";

const EMOJIS = ["⚡", "😱", "🙉", "😂", "🌧️"];

interface ReactionBarProps {
  onReact: (emoji: string, text?: string) => void;
  disabled?: boolean;
}

export default function ReactionBar({ onReact, disabled }: ReactionBarProps) {
  const [text, setText] = useState("");
  const [cooldown, setCooldown] = useState(false);

  const handleEmoji = useCallback(
    (emoji: string) => {
      if (cooldown || disabled) return;
      onReact(emoji);
      setCooldown(true);
      setTimeout(() => setCooldown(false), 30000);
    },
    [cooldown, disabled, onReact]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!text.trim() || cooldown || disabled) return;
      onReact("💬", text.trim());
      setText("");
      setCooldown(true);
      setTimeout(() => setCooldown(false), 30000);
    },
    [text, cooldown, disabled, onReact]
  );

  return (
    <div className="px-5 py-4 border-t border-[var(--border)] flex flex-col gap-3">
      {/* Emoji buttons */}
      <div className="flex gap-2 justify-center">
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleEmoji(emoji)}
            disabled={cooldown || disabled}
            className="w-[52px] h-[52px] rounded-full border-2 border-[var(--border)] bg-[#1a1a3a] flex items-center justify-center text-2xl transition-all hover:border-[var(--accent)] hover:scale-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Text input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={cooldown ? "30초 후 다시 반응 가능" : "반응을 남겨보세요..."}
          maxLength={200}
          disabled={cooldown || disabled}
          className="flex-1 bg-[#1a1a3a] border border-[var(--border)] rounded-full px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)] disabled:opacity-40 placeholder:text-gray-600"
        />
        <button
          type="submit"
          disabled={!text.trim() || cooldown || disabled}
          className="bg-[var(--accent)] text-[#0a0a1a] rounded-full px-5 py-2.5 font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          전송
        </button>
      </form>
    </div>
  );
}
