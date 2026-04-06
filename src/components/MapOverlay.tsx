"use client";

import ShareButton from "./ShareButton";

interface MapOverlayProps {
  areaName?: string;
  reactionCount?: number;
  lightningCount?: number;
  isLive?: boolean;
  onMyLocation?: () => void;
}

export default function MapOverlay({
  areaName = "내 주변",
  reactionCount = 0,
  lightningCount = 0,
  isLive = false,
  onMyLocation,
}: MapOverlayProps) {
  return (
    <div className="absolute top-3 left-3 right-3 md:top-5 md:left-5 md:right-5 z-10 flex items-start justify-between">
      <div>
        <h1 className="text-lg md:text-2xl font-bold text-[var(--accent)] tracking-tight pointer-events-none">
          ⚡ Hear That?
        </h1>
        <p className="text-xs md:text-sm text-[var(--text-secondary)] mt-0.5 pointer-events-none">
          천둥이 치면 같은 동네 반응을 본다
        </p>
        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          {isLive ? (
            <span className="bg-red-600 text-white text-[10px] md:text-xs font-bold px-1.5 py-0.5 rounded animate-pulse pointer-events-none">
              ● LIVE
            </span>
          ) : (
            <span className="bg-[var(--surface)] text-[var(--text-secondary)] text-[10px] md:text-xs font-bold px-1.5 py-0.5 rounded pointer-events-none">
              대기중
            </span>
          )}
          {lightningCount > 0 && (
            <span className="bg-[var(--accent)]/20 text-[var(--accent)] text-[10px] md:text-xs font-medium px-1.5 py-0.5 rounded pointer-events-none">
              ⚡ {lightningCount}건
            </span>
          )}
          {onMyLocation && (
            <button
              onClick={onMyLocation}
              className="bg-black/60 backdrop-blur-md text-[var(--text-primary)] hover:text-[var(--accent)] text-[10px] md:text-xs px-1.5 py-0.5 rounded transition-colors"
            >
              📍 내 위치
            </button>
          )}
        </div>
      </div>
      <div className="pointer-events-auto shrink-0">
        <ShareButton areaName={areaName} reactionCount={reactionCount} />
      </div>
    </div>
  );
}
