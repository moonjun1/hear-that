"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const DEFAULT_CENTER: [number, number] = [126.978, 37.5665]; // 서울
const DEFAULT_ZOOM = 12;

export default function Map() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null
  );

  useEffect(() => {
    if (!mapContainer.current || !MAPBOX_TOKEN) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const initMap = (center: [number, number]) => {
      if (!mapContainer.current) return;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/dark-v11",
        center,
        zoom: DEFAULT_ZOOM,
        attributionControl: false,
      });

      map.current.addControl(
        new mapboxgl.NavigationControl({ showCompass: false }),
        "bottom-right"
      );

      map.current.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: true,
          showUserHeading: true,
        }),
        "bottom-right"
      );
    };

    // 위치 권한 요청
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc: [number, number] = [
            pos.coords.longitude,
            pos.coords.latitude,
          ];
          setUserLocation(loc);
          initMap(loc);
        },
        () => {
          // 위치 거부 시 서울 fallback
          initMap(DEFAULT_CENTER);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      initMap(DEFAULT_CENTER);
    }

    return () => {
      map.current?.remove();
    };
  }, []);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#111128] text-gray-500">
        <p>NEXT_PUBLIC_MAPBOX_TOKEN을 설정해주세요</p>
      </div>
    );
  }

  return <div ref={mapContainer} className="flex-1 h-full" />;
}
