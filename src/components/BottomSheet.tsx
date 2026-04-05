"use client";

import { useState, useRef, useCallback, type ReactNode } from "react";

interface BottomSheetProps {
  children: ReactNode;
}

type SheetState = "mini" | "half" | "full";

const HEIGHTS: Record<SheetState, string> = {
  mini: "120px",
  half: "50vh",
  full: "85vh",
};

export default function BottomSheet({ children }: BottomSheetProps) {
  const [state, setState] = useState<SheetState>("mini");
  const startY = useRef(0);
  const startHeight = useRef(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    startHeight.current = sheetRef.current?.getBoundingClientRect().height ?? 0;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const deltaY = startY.current - e.changedTouches[0].clientY;
      const threshold = 50;

      if (deltaY > threshold) {
        // 위로 스와이프
        if (state === "mini") setState("half");
        else if (state === "half") setState("full");
      } else if (deltaY < -threshold) {
        // 아래로 스와이프
        if (state === "full") setState("half");
        else if (state === "half") setState("mini");
      }
    },
    [state]
  );

  return (
    <div
      ref={sheetRef}
      className="fixed bottom-0 left-0 right-0 bg-[var(--panel)] rounded-t-2xl border-t border-[var(--border)] z-20 transition-all duration-300 ease-out md:hidden"
      style={{ height: HEIGHTS[state] }}
    >
      {/* Handle */}
      <div
        className="flex justify-center py-3 cursor-grab active:cursor-grabbing"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="w-10 h-1 bg-gray-600 rounded-full" />
      </div>

      {/* Content */}
      <div className="overflow-y-auto" style={{ height: `calc(${HEIGHTS[state]} - 40px)` }}>
        {children}
      </div>
    </div>
  );
}
