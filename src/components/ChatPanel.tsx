"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { ChatMessage } from "@/types";
import { nicknameFromUuid } from "@/lib/nickname";
import { getDeviceUUID } from "@/lib/device";

interface ChatPanelProps {
  messages: ChatMessage[];
  onSend: (text: string) => void;
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

export default function ChatPanel({ messages, onSend, areaName }: ChatPanelProps) {
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const myUuid = typeof window !== "undefined" ? getDeviceUUID() : "";

  // 새 메시지 오면 스크롤 맨 아래로
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!text.trim()) return;
      onSend(text.trim());
      setText("");
    },
    [text, onSend]
  );

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="px-5 py-3 border-b border-[var(--border)] flex items-center justify-between">
        <span className="text-sm text-gray-400">💬 {areaName} 채팅</span>
        <span className="text-xs text-gray-600">{messages.length}개 메시지</span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {(() => {
          const tenMinAgo = Date.now() - 10 * 60 * 1000;
          const visible = messages.filter(
            (m) => new Date(m.created_at).getTime() > tenMinAgo
          );
          if (visible.length === 0) {
            return (
              <div className="flex flex-col items-center justify-center h-full text-center gap-2">
                <p className="text-3xl">💬</p>
                <p className="text-gray-400 text-sm">
                  아직 채팅이 없어요
                </p>
                <p className="text-gray-600 text-xs">
                  같은 동네 사람들과 대화해보세요
                </p>
              </div>
            );
          }
          return visible.map((msg) => {
            const isMe = msg.device_uuid === myUuid;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                <span className={`text-xs mb-1 ${isMe ? "text-[var(--accent)]" : "text-gray-500"}`}>
                  {isMe ? "나" : nicknameFromUuid(msg.device_uuid)}
                </span>
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                    isMe
                      ? "bg-[var(--accent)] text-[#0a0a1a] rounded-br-sm"
                      : "bg-[#1a1a3a] text-gray-200 rounded-bl-sm"
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[10px] text-gray-600 mt-1">
                  {timeAgo(msg.created_at)}
                </span>
              </div>
            );
          });
        })()}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="px-4 py-3 border-t border-[var(--border)] flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="메시지를 입력하세요..."
          maxLength={300}
          className="flex-1 bg-[#1a1a3a] border border-[var(--border)] rounded-full px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)] placeholder:text-gray-600"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="bg-[var(--accent)] text-[#0a0a1a] rounded-full px-5 py-2.5 font-semibold text-sm disabled:opacity-40"
        >
          전송
        </button>
      </form>
    </div>
  );
}
