import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { latLngToCell } from "h3-js";

const KMA_API_URL =
  "https://apis.data.go.kr/1360000/LgtInfoService/getLgt";
const H3_RESOLUTION = 5;

// service_role로 RLS 바이패스
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

function formatDateTimeKMA(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${y}${m}${d}${h}${min}`;
}

export async function GET() {
  const apiKey = process.env.KMA_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "KMA_API_KEY not set" }, { status: 500 });
  }

  const now = Date.now();
  const queryTime = new Date(now - 10 * 60 * 1000);
  const dateTime = formatDateTimeKMA(queryTime);

  const queryString = `ServiceKey=${apiKey}&pageNo=1&numOfRows=100&dataType=JSON&lgtType=1&dateTime=${dateTime}`;

  try {
    const res = await fetch(`${KMA_API_URL}?${queryString}`);
    const data = await res.json();

    const items = data?.response?.body?.items?.item;

    // 1. 기존 데이터 전부 삭제
    const { error: delError } = await supabaseAdmin
      .from("weather_events")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (delError) {
      console.error("Delete failed:", delError.message);
    }

    if (!items) {
      return NextResponse.json({ count: 0, queryTime: dateTime });
    }

    const lightnings = Array.isArray(items) ? items : [items];

    // 2. 한국 육지만 필터
    const onLand = lightnings.filter(
      (l: { wgs84Lat: number; wgs84Lon: number }) =>
        l.wgs84Lat >= 33.0 &&
        l.wgs84Lat <= 38.6 &&
        l.wgs84Lon >= 125.0 &&
        l.wgs84Lon <= 131.9
    );

    if (onLand.length === 0) {
      return NextResponse.json({ count: 0, queryTime: dateTime });
    }

    // 3. 새 데이터 insert
    const events = onLand.map(
      (l: { wgs84Lat: number; wgs84Lon: number }) => ({
        lat: l.wgs84Lat,
        lng: l.wgs84Lon,
        type: "thunder",
        source: "kma",
        h3_index: latLngToCell(l.wgs84Lat, l.wgs84Lon, H3_RESOLUTION),
      })
    );

    const { error: insError } = await supabaseAdmin
      .from("weather_events")
      .insert(events);

    if (insError) {
      return NextResponse.json({ error: insError.message }, { status: 500 });
    }

    return NextResponse.json({ count: events.length, queryTime: dateTime });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
