"use client";

import { useState, useRef, useCallback, useEffect, type ReactNode } from "react";

interface BottomSheetProps {
  children: ReactNode;
}

type SheetState = "mini" | "half" | "full";

const HEIGHTS: Record<SheetState, string> = {
  mini: "220px",
  half: "50vh",
  full: "85vh",
};

export default function BottomSheet({ children }: BottomSheetProps) {
  const [state, setState] = useState<SheetState>("mini");
  const startY = useRef(0);
  const startTime = useRef(0);
  const sheetRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    startTime.current = Date.now();
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const deltaY = startY.current - e.changedTouches[0].clientY;
      const elapsed = Date.now() - startTime.current;
      const velocity = Math.abs(deltaY) / elapsed; // px/ms

      // 빠른 플릭이면 threshold 낮게
      const threshold = velocity > 0.5 ? 15 : 30;

      if (deltaY > threshold) {
        // 위로 스와이프
        if (state === "mini") setState("half");
        else if (state === "half") setState("full");
      } else if (deltaY < -threshold) {
        // 아래로 스와이프
        if (state === "full") setState("half");
        else if (state === "half") setState("mini");
        else if (state === "mini") return; // 이미 최소
      }
    },
    [state]
  );

  // 핸들 탭하면 토글
  const handleTap = useCallback(() => {
    setState((prev) => {
      if (prev === "mini") return "half";
      if (prev === "half") return "full";
      return "mini";
    });
  }, []);

  // 입력 포커스 시 자동 확장
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        setState("full");
      }
    };
    const sheet = sheetRef.current;
    sheet?.addEventListener("focusin", handleFocusIn);
    return () => sheet?.removeEventListener("focusin", handleFocusIn);
  }, []);

  return (
    <div
      ref={sheetRef}
      className="fixed bottom-0 left-0 right-0 bg-[var(--panel)] rounded-t-2xl border-t border-[var(--border)] z-20 transition-all duration-300 ease-out md:hidden pb-[env(safe-area-inset-bottom)]"
      style={{ height: HEIGHTS[state] }}
    >
      {/* Handle */}
      <div
        className="flex justify-center py-3 cursor-grab active:cursor-grabbing"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={handleTap}
      >
        <div className="w-10 h-1 bg-[var(--text-tertiary)] rounded-full" />
      </div>

      {/* Content */}
      <div
        ref={contentRef}
        className="overflow-y-auto"
        style={{ height: `calc(${HEIGHTS[state]} - 40px - env(safe-area-inset-bottom, 0px))` }}
        onTouchStart={handleTouchStart}
        onTouchEnd={(e) => {
          // 스크롤 맨 위에서 아래로 스와이프하면 시트 접기
          if (contentRef.current && contentRef.current.scrollTop === 0) {
            handleTouchEnd(e);
          }
        }}
      >
        {children}
      </div>
    </div>
  );
}
