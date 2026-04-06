"use client";

import { useState, useRef, useCallback, type ReactNode } from "react";

interface BottomSheetProps {
  children: ReactNode;
}

type SheetState = "mini" | "full";

const HEIGHTS: Record<SheetState, string> = {
  mini: "120px",
  full: "75vh",
};

export default function BottomSheet({ children }: BottomSheetProps) {
  const [state, setState] = useState<SheetState>("mini");
  const startY = useRef(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const deltaY = startY.current - e.changedTouches[0].clientY;
      const threshold = 30;

      if (deltaY > threshold) {
        setState("full");
      } else if (deltaY < -threshold) {
        setState("mini");
      }
    },
    []
  );

  // 핸들 탭하면 토글
  const handleTap = useCallback(() => {
    setState((prev) => (prev === "mini" ? "full" : "mini"));
  }, []);

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
        onClick={handleTap}
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
