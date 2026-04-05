"use client";

import { useEffect, useRef } from "react";
import type mapboxgl from "mapbox-gl";
import type { WeatherEvent, Reaction } from "@/types";

interface ThunderWaveProps {
  getMap: () => mapboxgl.Map | null;
  weatherEvents: WeatherEvent[];
  reactions: Reaction[];
  replay?: boolean;
}

interface WaveState {
  centerLat: number;
  centerLng: number;
  startTime: number;
  eventTime: string;
}

const SOUND_SPEED_KM_S = 0.343; // 343 m/s
const WAVE_MAX_RADIUS_KM = 15;
const WAVE_COLOR = "rgba(255, 200, 50, 0.6)";
const WAVE_FADE_COLOR = "rgba(255, 200, 50, 0)";
const REPLAY_SPEED = 10;

function lngLatToPixel(
  map: mapboxgl.Map,
  lng: number,
  lat: number
): { x: number; y: number } {
  const point = map.project([lng, lat]);
  return { x: point.x, y: point.y };
}

function kmToPixels(map: mapboxgl.Map, lat: number, km: number): number {
  // 위도에서의 1도당 km
  const degPerKm = 1 / 111.32;
  const point1 = map.project([0, lat]);
  const point2 = map.project([0, lat + degPerKm * km]);
  return Math.abs(point2.y - point1.y);
}

export default function ThunderWave({
  getMap,
  weatherEvents,
  reactions,
  replay = false,
}: ThunderWaveProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wavesRef = useRef<WaveState[]>([]);
  const animFrameRef = useRef<number>(0);

  // 새 weather event가 오면 wave 추가
  useEffect(() => {
    if (weatherEvents.length === 0) return;

    const latest = weatherEvents[0];
    const alreadyExists = wavesRef.current.some(
      (w) => w.eventTime === latest.created_at
    );
    if (alreadyExists) return;

    wavesRef.current.push({
      centerLat: latest.lat,
      centerLng: latest.lng,
      startTime: replay ? Date.now() - 60_000 : Date.now(),
      eventTime: latest.created_at,
    });

    // 오래된 wave 정리 (5분 이상)
    wavesRef.current = wavesRef.current.filter(
      (w) => Date.now() - w.startTime < 5 * 60 * 1000
    );
  }, [weatherEvents, replay]);

  // 애니메이션 루프
  useEffect(() => {
    const canvas = canvasRef.current;
    const map = getMap();
    if (!canvas || !map) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      const container = map.getContainer();
      canvas.width = container.clientWidth * window.devicePixelRatio;
      canvas.height = container.clientHeight * window.devicePixelRatio;
      canvas.style.width = `${container.clientWidth}px`;
      canvas.style.height = `${container.clientHeight}px`;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    map.on("resize", resizeCanvas);
    map.on("move", () => {}); // trigger re-render on pan/zoom

    const animate = () => {
      const container = map.getContainer();
      ctx.clearRect(0, 0, container.clientWidth, container.clientHeight);

      const now = Date.now();
      const speed = replay ? SOUND_SPEED_KM_S * REPLAY_SPEED : SOUND_SPEED_KM_S;

      for (const wave of wavesRef.current) {
        const elapsed = (now - wave.startTime) / 1000; // seconds
        const radiusKm = elapsed * speed;

        if (radiusKm > WAVE_MAX_RADIUS_KM) continue;

        const center = lngLatToPixel(map, wave.centerLng, wave.centerLat);
        const radiusPx = kmToPixels(map, wave.centerLat, radiusKm);

        // 여러 겹의 링 그리기
        const ringCount = 4;
        for (let i = 0; i < ringCount; i++) {
          const ringRadius = radiusPx - i * 8;
          if (ringRadius <= 0) continue;

          const opacity = Math.max(0, 0.6 - (radiusKm / WAVE_MAX_RADIUS_KM) * 0.6 - i * 0.1);

          ctx.beginPath();
          ctx.arc(center.x, center.y, ringRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 200, 50, ${opacity})`;
          ctx.lineWidth = 2 - i * 0.3;
          ctx.stroke();
        }

        // 중심점 표시
        ctx.beginPath();
        ctx.arc(center.x, center.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = WAVE_COLOR;
        ctx.fill();
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      map.off("resize", resizeCanvas);
    };
  }, [getMap, replay]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-[5] pointer-events-none"
    />
  );
}
