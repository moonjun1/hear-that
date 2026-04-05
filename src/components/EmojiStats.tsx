"use client";

import { useMemo } from "react";
import type { Reaction } from "@/types";

interface EmojiStatsProps {
  reactions: Reaction[];
}

export default function EmojiStats({ reactions }: EmojiStatsProps) {
  const sorted = useMemo(() => {
    if (reactions.length === 0) return [];
    const counts: Record<string, number> = {};
    reactions.forEach((r) => {
      counts[r.emoji] = (counts[r.emoji] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [reactions]);

  if (sorted.length === 0) return null;

  return (
    <div className="flex gap-3 px-5 py-2 border-b border-[var(--border)] overflow-x-auto">
      {sorted.map(([emoji, count]) => (
        <div key={emoji} className="flex items-center gap-1 shrink-0">
          <span className="text-lg">{emoji}</span>
          <span className="text-xs text-gray-500">{count}</span>
        </div>
      ))}
    </div>
  );
}
