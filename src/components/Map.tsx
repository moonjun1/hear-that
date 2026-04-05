"use client";

import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Reaction } from "@/types";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const DEFAULT_CENTER: [number, number] = [126.978, 37.5665];
const DEFAULT_ZOOM = 12;

export interface MapHandle {
  addReactionMarker: (reaction: Reaction) => void;
  getMap: () => mapboxgl.Map | null;
}

interface MapProps {
  onLocationReady?: (lat: number, lng: number) => void;
}

const Map = forwardRef<MapHandle, MapProps>(({ onLocationReady }, ref) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<Map<string, mapboxgl.Marker>>(new globalThis.Map());

  useImperativeHandle(ref, () => ({
    addReactionMarker(reaction: Reaction) {
      if (!map.current || markers.current.has(reaction.id)) return;

      const el = document.createElement("div");
      el.className = "reaction-marker";
      el.textContent = reaction.emoji;
      el.style.cssText =
        "font-size:28px;cursor:pointer;animation:markerPop 0.3s ease-out;filter:drop-shadow(0 0 6px rgba(255,200,50,0.5));";

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([reaction.lng, reaction.lat])
        .addTo(map.current);

      if (reaction.text) {
        marker.setPopup(
          new mapboxgl.Popup({ offset: 25, closeButton: false }).setText(
            reaction.text
          )
        );
      }

      markers.current.set(reaction.id, marker);

      // 60초 후 fade out
      setTimeout(() => {
        el.style.transition = "opacity 1s";
        el.style.opacity = "0";
        setTimeout(() => {
          marker.remove();
          markers.current.delete(reaction.id);
        }, 1000);
      }, 300_000); // 5분
    },
    getMap: () => map.current,
  }));

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

      // 한국어 라벨
      map.current.on("style.load", () => {
        map.current?.getStyle().layers?.forEach((layer) => {
          if (
            layer.type === "symbol" &&
            (layer.layout as Record<string, unknown>)?.["text-field"]
          ) {
            map.current?.setLayoutProperty(layer.id, "text-field", [
              "coalesce",
              ["get", "name_ko"],
              ["get", "name"],
            ]);
          }
        });
      });

      map.current.addControl(
        new mapboxgl.NavigationControl({ showCompass: false }),
        "bottom-right"
      );

      const geolocate = new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true,
      });
      map.current.addControl(geolocate, "bottom-right");
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc: [number, number] = [
            pos.coords.longitude,
            pos.coords.latitude,
          ];
          initMap(loc);
          onLocationReady?.(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          initMap(DEFAULT_CENTER);
          onLocationReady?.(DEFAULT_CENTER[1], DEFAULT_CENTER[0]);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      initMap(DEFAULT_CENTER);
      onLocationReady?.(DEFAULT_CENTER[1], DEFAULT_CENTER[0]);
    }

    return () => {
      map.current?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#111128] text-gray-500">
        <p>NEXT_PUBLIC_MAPBOX_TOKEN을 설정해주세요</p>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @keyframes markerPop {
          0% {
            transform: scale(0);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
      <div ref={mapContainer} className="flex-1 h-full" />
    </>
  );
});

Map.displayName = "Map";
export default Map;
