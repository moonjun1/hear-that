"use client";

import { useState, useCallback, useEffect, useRef } from "react";

const EMOJIS = ["⚡", "😱", "🙉", "😂", "🌧️"];
const COOLDOWN_SEC = 10;

interface ReactionBarProps {
  onReact: (emoji: string, text?: string) => void;
  disabled?: boolean;
}

export default function ReactionBar({ onReact, disabled }: ReactionBarProps) {
  const [text, setText] = useState("");
  const [remaining, setRemaining] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cooldown = remaining > 0;

  const startCooldown = useCallback(() => {
    setRemaining(COOLDOWN_SEC);
    timerRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleEmoji = useCallback(
    (emoji: string) => {
      if (cooldown || disabled) return;
      onReact(emoji);
      startCooldown();
    },
    [cooldown, disabled, onReact, startCooldown]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!text.trim() || cooldown || disabled) return;
      onReact("💬", text.trim());
      setText("");
      startCooldown();
    },
    [text, cooldown, disabled, onReact, startCooldown]
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
            className="w-[52px] h-[52px] rounded-full border-2 border-[var(--border)] bg-[var(--surface)] flex items-center justify-center text-2xl transition-all hover:border-[var(--accent)] hover:scale-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
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
          placeholder={cooldown ? `${remaining}초 후 다시 반응 가능` : "반응을 남겨보세요..."}
          maxLength={200}
          disabled={cooldown || disabled}
          className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-full px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)] disabled:opacity-40 placeholder:text-[var(--text-tertiary)]"
        />
        <button
          type="submit"
          disabled={!text.trim() || cooldown || disabled}
          className="bg-[var(--accent)] text-[var(--background)] rounded-full px-5 py-2.5 font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {cooldown ? `${remaining}s` : "전송"}
        </button>
      </form>
    </div>
  );
}
