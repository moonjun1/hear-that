"use client";

import { useState, useCallback, useRef, useEffect } from "react";
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

  // 구독 중복 방지
  const unsubRef = useRef<(() => void) | null>(null);
  const initialized = useRef(false);

  // 피드 중복 방지
  const seenReactionIds = useRef<Set<string>>(new Set());

  const addReaction = useCallback((r: Reaction) => {
    if (seenReactionIds.current.has(r.id)) return;
    seenReactionIds.current.add(r.id);
    setReactions((prev) => [r, ...prev].slice(0, 200));
    mapRef.current?.addReactionMarker(r);
  }, []);

  const handleLocationReady = useCallback(
    (lat: number, lng: number) => {
      // 중복 초기화 방지
      if (initialized.current) return;
      initialized.current = true;

      setUserLat(lat);
      setUserLng(lng);

      getAreaName(lat, lng).then(setAreaName);

      const h3Index = getH3Index(lat, lng);
      const neighbors = getH3Neighbors(h3Index);

      // 기존 구독 정리
      unsubRef.current?.();

      fetchRecentReactions(neighbors).then((existing) => {
        const fiveMinAgo = Date.now() - 5 * 60 * 1000;
        existing.forEach((r) => {
          if (seenReactionIds.current.has(r.id)) return;
          seenReactionIds.current.add(r.id);
          if (new Date(r.created_at).getTime() > fiveMinAgo) {
            mapRef.current?.addReactionMarker(r);
          }
        });
        setReactions(existing);
      });

      const unsubReactions = subscribeToReactions(neighbors, addReaction);

      fetchAllRecentLightning().then((all) => {
        setLightningCount(all.length);
        const fiveMinAgo = Date.now() - 5 * 60 * 1000;
        all
          .filter((e) => new Date(e.created_at).getTime() > fiveMinAgo)
          .forEach((e) => mapRef.current?.addLightningMarker(e));
      });

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

      unsubRef.current = () => {
        unsubReactions();
        unsubWeather();
      };
    },
    [addReaction]
  );

  // 컴포넌트 언마운트 시 구독 정리
  useEffect(() => {
    return () => {
      unsubRef.current?.();
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

  // 1분마다 기상청 API 폴링
  useEffect(() => {
    const poll = () => {
      fetch("/api/weather")
        .then((r) => r.json())
        .then((data) => {
          if (data.count > 0) {
            fetchAllRecentLightning().then((all) => {
              setLightningCount(all.length);
              const fiveMinAgo = Date.now() - 5 * 60 * 1000;
              all
                .filter((e) => new Date(e.created_at).getTime() > fiveMinAgo)
                .forEach((e) => mapRef.current?.addLightningMarker(e));
            });
          }
        })
        .catch(() => {});
    };

    poll();
    const interval = setInterval(poll, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

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
          onLightningClick={() => mapRef.current?.flyToLightning()}
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
            onLightningClick={() => mapRef.current?.flyToLightning()}
          />
          <ReactionBar onReact={handleReact} />
        </div>
      </BottomSheet>
    </div>
  );
}
