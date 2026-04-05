"use client";

import { useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import MapOverlay from "@/components/MapOverlay";
import MapStats from "@/components/MapStats";
import FeedPanel from "@/components/FeedPanel";
import ReactionBar from "@/components/ReactionBar";
import BottomSheet from "@/components/BottomSheet";
import {
  submitReaction,
  subscribeToReactions,
  fetchRecentReactions,
} from "@/lib/reactions";
import { getH3Index, getH3Neighbors, haversineDistance } from "@/lib/geo";
import { getAreaName } from "@/lib/location";
import {
  subscribeToWeatherEvents,
  fetchRecentWeatherEvents,
  fetchAllRecentLightning,
} from "@/lib/weather";
import type { Reaction, WeatherEvent } from "@/types";
import type { MapHandle } from "@/components/Map";

const Map = dynamic(() => import("@/components/Map"), { ssr: false });
const ThunderWave = dynamic(() => import("@/components/ThunderWave"), {
  ssr: false,
});

export default function Home() {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [areaName, setAreaName] = useState("내 주변");
  const [lastThunder, setLastThunder] = useState<string | null>(null);
  const [weatherEvents, setWeatherEvents] = useState<WeatherEvent[]>([]);
  const [lightningCount, setLightningCount] = useState(0);
  const mapRef = useRef<MapHandle>(null);

  const handleLocationReady = useCallback((lat: number, lng: number) => {
    setUserLat(lat);
    setUserLng(lng);

    getAreaName(lat, lng).then(setAreaName);

    const h3Index = getH3Index(lat, lng);
    const neighbors = getH3Neighbors(h3Index);

    fetchRecentReactions(neighbors).then((existing) => {
      setReactions(existing);
      existing.forEach((r) => mapRef.current?.addReactionMarker(r));
    });

    const unsubReactions = subscribeToReactions(neighbors, (newReaction) => {
      setReactions((prev) => [newReaction, ...prev].slice(0, 200));
      mapRef.current?.addReactionMarker(newReaction);
    });

    // 전국 번개 지도에 표시
    fetchAllRecentLightning().then((all) => {
      setLightningCount(all.length);
      all.forEach((e) => mapRef.current?.addLightningMarker(e));
    });

    // 내 지역 weather events (피드/통계용)
    fetchRecentWeatherEvents(neighbors).then((events) => {
      setWeatherEvents(events);
      if (events.length > 0) {
        const ago = Math.floor(
          (Date.now() - new Date(events[0].created_at).getTime()) / 60000
        );
        setLastThunder(ago < 1 ? "방금" : `${ago}분 전`);
      }
    });

    const unsubWeather = subscribeToWeatherEvents(neighbors, (event) => {
      setWeatherEvents((prev) => [event, ...prev].slice(0, 50));
      setLightningCount((prev) => prev + 1);
      setLastThunder("방금");
      mapRef.current?.addLightningMarker(event);
    });

    return () => {
      unsubReactions();
      unsubWeather();
    };
  }, []);

  const handleReact = useCallback(
    async (emoji: string, text?: string) => {
      const lat = userLat ?? 37.5665;
      const lng = userLng ?? 126.978;
      const result = await submitReaction(lat, lng, emoji, text);
      if (!result.success) console.error(result.error);
    },
    [userLat, userLng]
  );

  const radius =
    userLat && userLng && reactions.length > 0
      ? Math.max(
          ...reactions
            .slice(0, 20)
            .map((r) => haversineDistance(userLat, userLng, r.lat, r.lng))
        )
      : 0;

  const isLive = lightningCount > 0 || reactions.length > 0;

  return (
    <div className="flex h-screen">
      {/* Map area */}
      <div className="flex-1 relative">
        <Map ref={mapRef} onLocationReady={handleLocationReady} />
        <ThunderWave
          getMap={() => mapRef.current?.getMap() ?? null}
          weatherEvents={weatherEvents}
          reactions={reactions}
        />
        <MapOverlay
          areaName={areaName}
          reactionCount={reactions.length}
          lightningCount={lightningCount}
          isLive={isLive}
        />
        <MapStats
          reactionCount={reactions.length}
          radius={radius}
          lastThunder={lastThunder}
        />
      </div>

      {/* Desktop: side panel */}
      <div className="hidden md:flex flex-col h-full">
        <FeedPanel
          reactions={reactions}
          areaName={areaName}
          userLat={userLat}
          userLng={userLng}
          lightningCount={lightningCount}
          lastThunder={lastThunder}
        />
        <ReactionBar onReact={handleReact} />
      </div>

      {/* Mobile: bottom sheet */}
      <BottomSheet>
        <div className="flex flex-col h-full">
          <FeedPanel
            reactions={reactions}
            areaName={areaName}
            userLat={userLat}
            userLng={userLng}
            lightningCount={lightningCount}
            lastThunder={lastThunder}
          />
          <ReactionBar onReact={handleReact} />
        </div>
      </BottomSheet>
    </div>
  );
}
