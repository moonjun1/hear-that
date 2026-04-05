import { supabase } from "./supabase";
import { getH3Index } from "./geo";
import type { WeatherEvent } from "@/types";

const KMA_API_URL =
  "http://apis.data.go.kr/1360000/LgtInfoService/getLgt";

interface KmaLightning {
  wgs84Lat: number;
  wgs84Lon: number;
  dateTime: string;
  intensity: number;
  lgtType: number;
}

function formatDateTimeKMA(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${y}${m}${d}${h}${min}`;
}

export async function fetchLightningData(
  apiKey: string
): Promise<KmaLightning[]> {
  // 10분 전 데이터 조회 (기상청 API 제한)
  const now = new Date();
  const queryTime = new Date(now.getTime() - 10 * 60 * 1000);
  const dateTime = formatDateTimeKMA(queryTime);

  const params = new URLSearchParams({
    ServiceKey: apiKey,
    pageNo: "1",
    numOfRows: "100",
    dataType: "JSON",
    lgtType: "1", // 대지방전(CG)
    dateTime,
  });

  try {
    const res = await fetch(`${KMA_API_URL}?${params}`);
    const data = await res.json();

    const items = data?.response?.body?.items?.item;
    if (!items) return [];

    return Array.isArray(items) ? items : [items];
  } catch {
    return [];
  }
}

export async function processLightningData(
  lightnings: KmaLightning[]
): Promise<WeatherEvent[]> {
  if (lightnings.length === 0) return [];

  const events: WeatherEvent[] = lightnings.map((l) => ({
    id: "",
    lat: l.wgs84Lat,
    lng: l.wgs84Lon,
    type: "thunder",
    source: "kma",
    created_at: new Date().toISOString(),
    h3_index: getH3Index(l.wgs84Lat, l.wgs84Lon),
  }));

  return events;
}

export async function saveWeatherEvents(
  events: Array<{ lat: number; lng: number; type: string; source: string; h3_index: string }>
): Promise<void> {
  if (events.length === 0) return;

  const { error } = await supabase.from("weather_events").insert(events);
  if (error) {
    console.error("Failed to save weather events:", error.message);
  }
}

export function subscribeToWeatherEvents(
  h3Indexes: string[],
  onNewEvent: (event: WeatherEvent) => void
) {
  const h3Set = new Set(h3Indexes);

  const channelName = `weather-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const channel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "weather_events",
      },
      (payload) => {
        const event = payload.new as WeatherEvent;
        if (h3Set.has(event.h3_index)) {
          onNewEvent(event);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// 전국 번개 (지도 표시용)
export async function fetchAllRecentLightning(
  minutesAgo = 30
): Promise<WeatherEvent[]> {
  const since = new Date(
    Date.now() - minutesAgo * 60 * 1000
  ).toISOString();

  const { data, error } = await supabase
    .from("weather_events")
    .select("*")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return [];
  return data as WeatherEvent[];
}

export async function fetchRecentWeatherEvents(
  h3Indexes: string[],
  minutesAgo = 30
): Promise<WeatherEvent[]> {
  const since = new Date(
    Date.now() - minutesAgo * 60 * 1000
  ).toISOString();

  const { data, error } = await supabase
    .from("weather_events")
    .select("*")
    .in("h3_index", h3Indexes)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return [];
  return data as WeatherEvent[];
}
