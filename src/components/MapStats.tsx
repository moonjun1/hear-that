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
  return (
    <div className="absolute bottom-5 left-5 z-10 flex gap-3 pointer-events-none">
      <div className="bg-black/60 backdrop-blur-md px-3 py-2 rounded-lg">
        <div className="text-xl font-bold text-[var(--accent)]">
          {reactionCount}
        </div>
        <div className="text-[11px] text-gray-500">반응</div>
      </div>
      <div className="bg-black/60 backdrop-blur-md px-3 py-2 rounded-lg">
        <div className="text-xl font-bold text-[var(--accent)]">
          {radius.toFixed(1)}km
        </div>
        <div className="text-[11px] text-gray-500">반경</div>
      </div>
      {lastThunder && (
        <div className="bg-black/60 backdrop-blur-md px-3 py-2 rounded-lg">
          <div className="text-xl font-bold text-[var(--accent)]">
            {lastThunder}
          </div>
          <div className="text-[11px] text-gray-500">마지막 천둥</div>
        </div>
      )}
    </div>
  );
}
