"use client";

import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Reaction, WeatherEvent } from "@/types";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const DEFAULT_CENTER: [number, number] = [126.978, 37.5665];
const DEFAULT_ZOOM = 12;
const SOURCE_ID = "reactions-source";
const CLUSTER_LAYER = "clusters";
const CLUSTER_COUNT_LAYER = "cluster-count";
const UNCLUSTERED_LAYER = "unclustered-point";

export interface MapHandle {
  addReactionMarker: (reaction: Reaction) => void;
  addLightningMarker: (event: WeatherEvent) => void;
  flyToLightning: () => void;
  getMap: () => mapboxgl.Map | null;
}

interface MapProps {
  onLocationReady?: (lat: number, lng: number) => void;
}

const Map = forwardRef<MapHandle, MapProps>(({ onLocationReady }, ref) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const reactionsData = useRef<
    GeoJSON.FeatureCollection<GeoJSON.Point>
  >({
    type: "FeatureCollection",
    features: [],
  });
  const seenIds = useRef<Set<string>>(new Set());
  const emojiMarkers = useRef<Map<string, mapboxgl.Marker>>(new globalThis.Map());
  const lastLightningPositions = useRef<[number, number][]>([]);

  function updateSource() {
    const source = map.current?.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    if (source) {
      source.setData(reactionsData.current);
    }
  }

  // 개별 이모지 마커 (줌인 시 클러스터 해제된 포인트용)
  function syncEmojiMarkers() {
    if (!map.current) return;

    const zoom = map.current.getZoom();
    // 줌 14 이상이면 개별 이모지 마커 표시
    if (zoom >= 14) {
      const bounds = map.current.getBounds();
      reactionsData.current.features.forEach((f) => {
        const id = f.properties?.id as string;
        const [lng, lat] = f.geometry.coordinates;
        if (!bounds?.contains([lng, lat])) {
          emojiMarkers.current.get(id)?.remove();
          emojiMarkers.current.delete(id);
          return;
        }
        if (emojiMarkers.current.has(id)) return;

        const el = document.createElement("div");
        el.textContent = f.properties?.emoji || "⚡";
        el.style.cssText =
          "font-size:28px;cursor:pointer;filter:drop-shadow(0 0 6px rgba(255,200,50,0.5));animation:markerPop 0.3s ease-out;";

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([lng, lat])
          .addTo(map.current!);

        if (f.properties?.text) {
          marker.setPopup(
            new mapboxgl.Popup({ offset: 25, closeButton: false }).setText(
              f.properties.text
            )
          );
        }
        emojiMarkers.current.set(id, marker);
      });
    } else {
      // 줌아웃이면 개별 마커 전부 제거 (클러스터로 보임)
      emojiMarkers.current.forEach((m) => m.remove());
      emojiMarkers.current.clear();
    }
  }

  useImperativeHandle(ref, () => ({
    addReactionMarker(reaction: Reaction) {
      if (seenIds.current.has(reaction.id)) return;
      seenIds.current.add(reaction.id);

      reactionsData.current.features.push({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [reaction.lng, reaction.lat],
        },
        properties: {
          id: reaction.id,
          emoji: reaction.emoji,
          text: reaction.text,
          created_at: reaction.created_at,
        },
      });

      updateSource();
      syncEmojiMarkers();

      // 5분 후 제거
      setTimeout(() => {
        reactionsData.current.features =
          reactionsData.current.features.filter(
            (f) => f.properties?.id !== reaction.id
          );
        seenIds.current.delete(reaction.id);
        emojiMarkers.current.get(reaction.id)?.remove();
        emojiMarkers.current.delete(reaction.id);
        updateSource();
      }, 300_000);
    },
    addLightningMarker(event: WeatherEvent) {
      if (!map.current) return;

      lastLightningPositions.current.push([event.lng, event.lat]);
      // 최근 50개만 유지
      if (lastLightningPositions.current.length > 50) {
        lastLightningPositions.current = lastLightningPositions.current.slice(-50);
      }

      const el = document.createElement("div");
      el.textContent = "⚡";
      el.style.cssText =
        "font-size:36px;filter:drop-shadow(0 0 12px rgba(255,200,50,0.8));animation:markerPop 0.3s ease-out;cursor:pointer;";

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([event.lng, event.lat])
        .addTo(map.current);

      // 시간 계산
      const ago = Math.floor(
        (Date.now() - new Date(event.created_at).getTime()) / 60000
      );
      const timeText = ago < 1 ? "방금" : `${ago}분 전`;

      // 역지오코딩으로 지역명 팝업
      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: false,
        className: "lightning-popup",
      }).setHTML(
        `<div style="background:#1a1a3a;color:#e0e0e0;padding:8px 12px;border-radius:8px;font-size:13px;min-width:120px;">
          <div style="font-size:18px;margin-bottom:4px;">⚡ 낙뢰 감지</div>
          <div style="color:#888;font-size:11px;">${timeText}</div>
          <div id="lightning-loc-${event.id}" style="color:#ffc832;margin-top:4px;font-size:12px;">위치 확인 중...</div>
        </div>`
      );
      marker.setPopup(popup);

      // 클릭 시 역지오코딩
      el.addEventListener("click", () => {
        const locEl = document.getElementById(`lightning-loc-${event.id}`);
        if (locEl && locEl.textContent === "위치 확인 중...") {
          fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${event.lng},${event.lat}.json?types=locality,place,district&language=ko&access_token=${MAPBOX_TOKEN}`
          )
            .then((r) => r.json())
            .then((data) => {
              const name = data.features?.[0]?.place_name || `${event.lat.toFixed(2)}°N ${event.lng.toFixed(2)}°E`;
              if (locEl) locEl.textContent = name;
            })
            .catch(() => {
              if (locEl) locEl.textContent = `${event.lat.toFixed(2)}°N ${event.lng.toFixed(2)}°E`;
            });
        }
      });

      // 5분 후 제거
      setTimeout(() => {
        el.style.transition = "opacity 2s";
        el.style.opacity = "0";
        setTimeout(() => marker.remove(), 2000);
      }, 300_000);
    },
    flyToLightning() {
      if (!map.current || !lastLightningPositions.current.length) return;

      const positions = lastLightningPositions.current;
      if (positions.length === 1) {
        map.current.flyTo({
          center: positions[0],
          zoom: 10,
          duration: 1500,
        });
      } else {
        const bounds = new mapboxgl.LngLatBounds();
        positions.forEach((p) => bounds.extend(p));
        map.current.fitBounds(bounds, {
          padding: 80,
          duration: 1500,
          maxZoom: 10,
        });
      }
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

      map.current.on("style.load", () => {
        // 한국어 라벨
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

      map.current.on("load", () => {
        // 중복 방지
        if (map.current!.getSource(SOURCE_ID)) return;

        // 클러스터링 GeoJSON source
        map.current!.addSource(SOURCE_ID, {
          type: "geojson",
          data: reactionsData.current,
          cluster: true,
          clusterMaxZoom: 14,
          clusterRadius: 50,
        });

        // 클러스터 원 (당근 스타일)
        map.current!.addLayer({
          id: CLUSTER_LAYER,
          type: "circle",
          source: SOURCE_ID,
          filter: ["has", "point_count"],
          paint: {
            "circle-color": [
              "step",
              ["get", "point_count"],
              "#ffc832",  // 1-9: 골드
              10,
              "#ff9500", // 10-29: 오렌지
              30,
              "#ff3b3b", // 30+: 레드
            ],
            "circle-radius": [
              "step",
              ["get", "point_count"],
              20,  // 1-9
              10,
              25,  // 10-29
              30,
              35,  // 30+
            ],
            "circle-opacity": 0.85,
            "circle-stroke-width": 2,
            "circle-stroke-color": "rgba(255, 255, 255, 0.2)",
          },
        });

        // 클러스터 숫자
        map.current!.addLayer({
          id: CLUSTER_COUNT_LAYER,
          type: "symbol",
          source: SOURCE_ID,
          filter: ["has", "point_count"],
          layout: {
            "text-field": ["get", "point_count_abbreviated"],
            "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
            "text-size": 14,
          },
          paint: {
            "text-color": "#0a0a1a",
          },
        });

        // 비클러스터 포인트 (줌인 시 작은 골드 점, 이모지 마커가 위에 덮음)
        map.current!.addLayer({
          id: UNCLUSTERED_LAYER,
          type: "circle",
          source: SOURCE_ID,
          filter: ["!", ["has", "point_count"]],
          paint: {
            "circle-color": "#ffc832",
            "circle-radius": 6,
            "circle-stroke-width": 1,
            "circle-stroke-color": "rgba(255, 200, 50, 0.5)",
          },
        });

        // 클러스터 클릭 → 줌인
        map.current!.on("click", CLUSTER_LAYER, (e) => {
          const features = map.current!.queryRenderedFeatures(e.point, {
            layers: [CLUSTER_LAYER],
          });
          if (!features.length) return;
          const clusterId = features[0].properties?.cluster_id;
          const source = map.current!.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource;
          source.getClusterExpansionZoom(clusterId, (err, zoom) => {
            if (err || !zoom) return;
            const geometry = features[0].geometry as GeoJSON.Point;
            map.current!.easeTo({
              center: geometry.coordinates as [number, number],
              zoom,
            });
          });
        });

        // 커서 스타일
        map.current!.on("mouseenter", CLUSTER_LAYER, () => {
          if (map.current) map.current.getCanvas().style.cursor = "pointer";
        });
        map.current!.on("mouseleave", CLUSTER_LAYER, () => {
          if (map.current) map.current.getCanvas().style.cursor = "";
        });
      });

      // 줌 변경 시 이모지 마커 동기화
      map.current.on("zoomend", syncEmojiMarkers);
      map.current.on("moveend", syncEmojiMarkers);

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
      emojiMarkers.current.forEach((m) => m.remove());
      emojiMarkers.current.clear();
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
          0% { transform: scale(0); }
          100% { transform: scale(1); }
        }
      `}</style>
      <div ref={mapContainer} className="flex-1 h-full" />
    </>
  );
});

Map.displayName = "Map";
export default Map;
