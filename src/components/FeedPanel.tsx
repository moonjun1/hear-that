"use client";

import type { Reaction, WeatherEvent } from "@/types";
import { nicknameFromUuid } from "@/lib/nickname";
import { getDeviceUUID } from "@/lib/device";

interface FeedPanelProps {
  reactions: Reaction[];
  areaName: string;
  userLat?: number | null;
  userLng?: number | null;
  lightningCount?: number;
  lastThunder?: string | null;
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

function distanceLabel(
  userLat: number | null | undefined,
  userLng: number | null | undefined,
  rLat: number,
  rLng: number
): string {
  if (!userLat || !userLng) return "";
  const R = 6371;
  const dLat = ((rLat - userLat) * Math.PI) / 180;
  const dLng = ((rLng - userLng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((userLat * Math.PI) / 180) *
      Math.cos((rLat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return d < 1 ? `${Math.round(d * 1000)}m` : `${d.toFixed(1)}km`;
}

export default function FeedPanel({
  reactions,
  areaName,
  userLat,
  userLng,
  lightningCount = 0,
  lastThunder,
}: FeedPanelProps) {
  const myUuid = typeof window !== "undefined" ? getDeviceUUID() : "";

  return (
    <div className="w-full md:w-[380px] bg-[var(--panel)] md:border-l border-[var(--border)] flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[var(--border)]">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">실시간 반응</h2>
          <span className="text-sm text-gray-500">{areaName}</span>
        </div>

        {/* 번개 활동 배너 */}
        {lightningCount > 0 && (
          <div className="mt-2 bg-[var(--accent)]/10 border border-[var(--accent)]/20 rounded-lg px-3 py-2 flex items-center gap-2">
            <span className="text-lg">⚡</span>
            <span className="text-sm text-[var(--accent)]">
              전국에서 번개 {lightningCount}건 감지 · {lastThunder || "방금"}
            </span>
          </div>
        )}
      </div>

      {/* Feed list */}
      <div className="flex-1 overflow-y-auto">
        {reactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-8 gap-4">
            {lightningCount > 0 ? (
              <>
                <p className="text-4xl">⚡</p>
                <p className="text-gray-400 text-sm">
                  지금 번개가 치고 있어요!<br />
                  아직 내 주변 반응은 없어요.
                </p>
                <p className="text-gray-600 text-xs">
                  첫 반응을 남겨보세요
                </p>
              </>
            ) : (
              <>
                <p className="text-4xl">🌙</p>
                <p className="text-gray-400 text-sm">
                  지금은 조용한 밤이에요
                </p>
                <p className="text-gray-600 text-xs">
                  천둥이 치면 같은 동네 사람들의<br />
                  반응이 여기에 나타나요
                </p>
              </>
            )}
          </div>
        ) : (
          reactions.map((r) => {
            const isMe = r.device_uuid === myUuid;
            return (
              <div
                key={r.id}
                className={`px-5 py-3 border-b border-white/5 animate-[slideIn_0.3s_ease-out] ${
                  isMe ? "bg-[var(--accent)]/5" : ""
                }`}
              >
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium flex items-center gap-1.5">
                    <span className={isMe ? "text-[var(--accent)]" : "text-gray-400"}>
                      {nicknameFromUuid(r.device_uuid)}
                    </span>
                    {isMe && (
                      <span className="text-[10px] bg-[var(--accent)]/20 text-[var(--accent)] px-1.5 py-0.5 rounded">
                        나
                      </span>
                    )}
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
                {(userLat || userLng) && (
                  <div className="text-[11px] text-gray-600 mt-1">
                    {distanceLabel(userLat, userLng, r.lat, r.lng)}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
