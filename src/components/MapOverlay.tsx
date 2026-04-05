"use client";

export default function MapOverlay() {
  return (
    <div className="absolute top-5 left-5 z-10 pointer-events-none">
      <h1 className="text-2xl font-bold text-[var(--accent)] tracking-tight">
        ⚡ Hear That?
      </h1>
      <p className="text-sm text-gray-500 mt-1">
        천둥이 치면 같은 동네 반응을 본다
      </p>
      <span className="inline-block mt-2 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded animate-pulse">
        ● LIVE
      </span>
    </div>
  );
}
