"use client";

interface MapStatsProps {
  reactionCount: number;
  radius: number;
  lastThunder: string | null;
}

export default function MapStats({
  reactionCount,
  radius,
  lastThunder,
}: MapStatsProps) {
  // 아무 활동 없으면 안 보여줌
  if (reactionCount === 0 && !lastThunder) return null;

  return (
    <div className="absolute bottom-5 left-5 z-10 flex gap-3 pointer-events-none">
      {reactionCount > 0 && (
        <div className="bg-black/60 backdrop-blur-md px-3 py-2 rounded-lg">
          <div className="text-xl font-bold text-[var(--accent)]">
            {reactionCount}
          </div>
          <div className="text-[11px] text-[var(--text-secondary)]">반응</div>
        </div>
      )}
      {reactionCount > 0 && radius > 0 && (
        <div className="bg-black/60 backdrop-blur-md px-3 py-2 rounded-lg">
          <div className="text-xl font-bold text-[var(--accent)]">
            {radius.toFixed(1)}km
          </div>
          <div className="text-[11px] text-[var(--text-secondary)]">반경</div>
        </div>
      )}
      {lastThunder && (
        <div className="bg-black/60 backdrop-blur-md px-3 py-2 rounded-lg">
          <div className="text-xl font-bold text-[var(--accent)]">
            {lastThunder}
          </div>
          <div className="text-[11px] text-[var(--text-secondary)]">마지막 천둥</div>
        </div>
      )}
    </div>
  );
}
