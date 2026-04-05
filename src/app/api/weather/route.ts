import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { latLngToCell } from "h3-js";

const KMA_API_URL =
  "http://apis.data.go.kr/1360000/LgtInfoService/getLgt";
const H3_RESOLUTION = 5;
const POLL_INTERVAL_MS = 60_000; // 1분

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 서버 메모리 캐시 — 마지막 폴링 시간
let lastPollTime = 0;
let lastPollResult = { count: 0, queryTime: "" };
let lastQueryTime = ""; // 마지막으로 조회한 기상청 dateTime

function formatDateTimeKMA(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${y}${m}${d}${h}${min}`;
}

export async function GET() {
  const now = Date.now();

  // 1분 이내 재호출이면 캐시 리턴 (기상청 API 보호)
  if (now - lastPollTime < POLL_INTERVAL_MS) {
    return NextResponse.json({
      ...lastPollResult,
      cached: true,
    });
  }

  const apiKey = process.env.KMA_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "KMA_API_KEY not set" }, { status: 500 });
  }

  const queryTime = new Date(now - 10 * 60 * 1000);
  const dateTime = formatDateTimeKMA(queryTime);

  const params = new URLSearchParams({
    ServiceKey: apiKey,
    pageNo: "1",
    numOfRows: "100",
    dataType: "JSON",
    lgtType: "1",
    dateTime,
  });

  try {
    const res = await fetch(`${KMA_API_URL}?${params}`);
    const data = await res.json();

    const items = data?.response?.body?.items?.item;
    if (!items) {
      lastPollTime = now;
      lastPollResult = { count: 0, queryTime: dateTime };
      return NextResponse.json(lastPollResult);
    }

    const lightnings = Array.isArray(items) ? items : [items];

    // 같은 시간대 데이터면 중복 insert 방지
    if (dateTime === lastQueryTime) {
      lastPollTime = now;
      return NextResponse.json({ ...lastPollResult, cached: true });
    }
    lastQueryTime = dateTime;

    // 5분 이상 된 데이터 정리
    await supabaseAdmin
      .from("weather_events")
      .delete()
      .lt("created_at", new Date(now - 5 * 60 * 1000).toISOString());

    // 한국 육지만 필터 (바다 번개 제외)
    // 대략 위도 33.0~38.6, 경도 125.0~131.9
    const onLand = lightnings.filter(
      (l: { wgs84Lat: number; wgs84Lon: number }) =>
        l.wgs84Lat >= 33.0 &&
        l.wgs84Lat <= 38.6 &&
        l.wgs84Lon >= 125.0 &&
        l.wgs84Lon <= 131.9
    );

    const events = onLand.map(
      (l: { wgs84Lat: number; wgs84Lon: number }) => ({
        lat: l.wgs84Lat,
        lng: l.wgs84Lon,
        type: "thunder",
        source: "kma",
        h3_index: latLngToCell(l.wgs84Lat, l.wgs84Lon, H3_RESOLUTION),
      })
    );

    const { error } = await supabaseAdmin
      .from("weather_events")
      .insert(events);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    lastPollTime = now;
    lastPollResult = { count: events.length, queryTime: dateTime };

    return NextResponse.json(lastPollResult);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
