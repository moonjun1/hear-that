"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import MapOverlay from "@/components/MapOverlay";
import MapStats from "@/components/MapStats";
import FeedPanel from "@/components/FeedPanel";
import ReactionBar from "@/components/ReactionBar";
import type { Reaction } from "@/types";

// Mapbox는 SSR에서 window 접근 문제 때문에 dynamic import
const Map = dynamic(() => import("@/components/Map"), { ssr: false });

export default function Home() {
  const [reactions, setReactions] = useState<Reaction[]>([]);

  const handleReact = useCallback((emoji: string, text?: string) => {
    // TODO: Day 2에서 Supabase insert로 교체
    const newReaction: Reaction = {
      id: crypto.randomUUID(),
      lat: 37.5665 + (Math.random() - 0.5) * 0.05,
      lng: 126.978 + (Math.random() - 0.5) * 0.05,
      emoji,
      text: text || null,
      created_at: new Date().toISOString(),
      h3_index: "",
      device_uuid: "local-test",
    };
    setReactions((prev) => [newReaction, ...prev]);
  }, []);

  return (
    <div className="flex h-screen">
      {/* Map area */}
      <div className="flex-1 relative">
        <Map />
        <MapOverlay />
        <MapStats reactionCount={reactions.length} radius={3.2} lastThunder={null} />
      </div>

      {/* Feed panel */}
      <div className="flex flex-col h-full">
        <FeedPanel reactions={reactions} areaName="내 주변" />
        <ReactionBar onReact={handleReact} />
      </div>
    </div>
  );
}
