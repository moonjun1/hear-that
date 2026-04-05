"use client";

import { useState, useCallback } from "react";

interface ShareButtonProps {
  areaName: string;
  reactionCount: number;
}

export default function ShareButton({
  areaName,
  reactionCount,
}: ShareButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = `⚡ ${areaName}에서 ${reactionCount}명이 천둥에 반응! - Hear That?`;

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Hear That? ⚡", text: shareText, url: shareUrl });
      } catch {
        // user cancelled
      }
    } else {
      setShowMenu((prev) => !prev);
    }
  }, [shareText, shareUrl]);

  const copyLink = useCallback(async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setShowMenu(false);
  }, [shareUrl]);

  const shareTwitter = useCallback(() => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      "_blank"
    );
    setShowMenu(false);
  }, [shareText, shareUrl]);

  return (
    <div className="relative">
      <button
        onClick={handleShare}
        className="bg-[var(--accent)] text-[#0a0a1a] rounded-full px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
      >
        {copied ? "복사됨!" : "공유"}
      </button>

      {showMenu && (
        <div className="absolute bottom-12 right-0 bg-[var(--panel)] border border-[var(--border)] rounded-lg shadow-lg overflow-hidden z-30 min-w-[160px]">
          <button
            onClick={copyLink}
            className="w-full px-4 py-3 text-left text-sm hover:bg-white/5 transition-colors"
          >
            링크 복사
          </button>
          <button
            onClick={shareTwitter}
            className="w-full px-4 py-3 text-left text-sm hover:bg-white/5 transition-colors"
          >
            트위터 공유
          </button>
        </div>
      )}
    </div>
  );
}
