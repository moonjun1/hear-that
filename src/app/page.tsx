"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import MapOverlay from "@/components/MapOverlay";
import MapStats from "@/components/MapStats";
import FeedPanel from "@/components/FeedPanel";
import ReactionBar from "@/components/ReactionBar";
import {
  submitReaction,
  subscribeToReactions,
  fetchRecentReactions,
} from "@/lib/reactions";
import { getH3Index, getH3Neighbors, haversineDistance } from "@/lib/geo";
import type { Reaction } from "@/types";
import type { MapHandle } from "@/components/Map";

const Map = dynamic(() => import("@/components/Map"), { ssr: false });

export default function Home() {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const mapRef = useRef<MapHandle>(null);

  const handleLocationReady = useCallback(
    (lat: number, lng: number) => {
      setUserLat(lat);
      setUserLng(lng);

      const h3Index = getH3Index(lat, lng);
      const neighbors = getH3Neighbors(h3Index);

      // 최근 반응 로드
      fetchRecentReactions(neighbors).then((existing) => {
        setReactions(existing);
        existing.forEach((r) => mapRef.current?.addReactionMarker(r));
      });

      // 실시간 구독
      const unsubscribe = subscribeToReactions(neighbors, (newReaction) => {
        setReactions((prev) => [newReaction, ...prev].slice(0, 200));
        mapRef.current?.addReactionMarker(newReaction);
      });

      return () => unsubscribe();
    },
    []
  );

  const handleReact = useCallback(
    async (emoji: string, text?: string) => {
      if (!userLat || !userLng) return;

      const result = await submitReaction(userLat, userLng, emoji, text);
      if (!result.success) {
        console.error(result.error);
      }
    },
    [userLat, userLng]
  );

  // 반경 계산
  const radius =
    userLat && userLng && reactions.length > 0
      ? Math.max(
          ...reactions
            .slice(0, 20)
            .map((r) => haversineDistance(userLat, userLng, r.lat, r.lng))
        )
      : 0;

  return (
    <div className="flex h-screen">
      {/* Map area */}
      <div className="flex-1 relative">
        <Map ref={mapRef} onLocationReady={handleLocationReady} />
        <MapOverlay />
        <MapStats
          reactionCount={reactions.length}
          radius={radius}
          lastThunder={null}
        />
      </div>

      {/* Feed panel */}
      <div className="flex flex-col h-full">
        <FeedPanel reactions={reactions} areaName="내 주변" />
        <ReactionBar
          onReact={handleReact}
          disabled={!userLat || !userLng}
        />
      </div>
    </div>
  );
}
