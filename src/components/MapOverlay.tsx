"use client";

import ShareButton from "./ShareButton";

interface MapOverlayProps {
  areaName?: string;
  reactionCount?: number;
  lightningCount?: number;
  isLive?: boolean;
}

export default function MapOverlay({
  areaName = "내 주변",
  reactionCount = 0,
  lightningCount = 0,
  isLive = false,
}: MapOverlayProps) {
  return (
    <div className="absolute top-5 left-5 right-5 z-10 flex items-start justify-between">
      <div className="pointer-events-none">
        <h1 className="text-2xl font-bold text-[var(--accent)] tracking-tight">
          ⚡ Hear That?
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          천둥이 치면 같은 동네 반응을 본다
        </p>
        <div className="flex items-center gap-2 mt-2">
          {isLive ? (
            <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded animate-pulse">
              ● LIVE
            </span>
          ) : (
            <span className="bg-gray-700 text-gray-400 text-xs font-bold px-2 py-0.5 rounded">
              대기중
            </span>
          )}
          {lightningCount > 0 && (
            <span className="bg-[var(--accent)]/20 text-[var(--accent)] text-xs font-medium px-2 py-0.5 rounded">
              ⚡ {lightningCount}건 감지
            </span>
          )}
        </div>
      </div>
      <div className="pointer-events-auto">
        <ShareButton areaName={areaName} reactionCount={reactionCount} />
      </div>
    </div>
  );
}
