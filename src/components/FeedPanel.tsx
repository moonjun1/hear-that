"use client";

import type { Reaction } from "@/types";

interface FeedPanelProps {
  reactions: Reaction[];
  areaName: string;
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  );
  if (diff < 10) return "방금";
  if (diff < 60) return `${diff}초 전`;
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  return `${Math.floor(diff / 3600)}시간 전`;
}

function anonName(uuid: string): string {
  const hash = uuid.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return `익명 #${hash % 100}`;
}

export default function FeedPanel({ reactions, areaName }: FeedPanelProps) {
  return (
    <div className="w-[380px] bg-[var(--panel)] border-l border-[var(--border)] flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
        <h2 className="text-base font-semibold">실시간 반응</h2>
        <span className="text-sm text-gray-500">{areaName}</span>
      </div>

      {/* Feed list */}
      <div className="flex-1 overflow-y-auto">
        {reactions.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-600 text-sm">
            아직 반응이 없어요. 첫 반응을 남겨보세요!
          </div>
        ) : (
          reactions.map((r) => (
            <div
              key={r.id}
              className="px-5 py-3 border-b border-white/5 animate-[slideIn_0.3s_ease-out]"
            >
              <div className="flex justify-between mb-1">
                <span className="text-sm text-[var(--accent)] font-medium">
                  {anonName(r.device_uuid)}
                </span>
                <span className="text-[11px] text-gray-600">
                  {timeAgo(r.created_at)}
                </span>
              </div>
              {r.text ? (
                <p className="text-sm leading-relaxed">{r.text}</p>
              ) : (
                <p className="text-3xl">{r.emoji}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
