import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { latLngToCell } from "h3-js";

const KMA_API_URL =
  "http://apis.data.go.kr/1360000/LgtInfoService/getLgt";
const H3_RESOLUTION = 5;

// service_role로 insert (RLS bypass)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
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

  // 10분 전 데이터 조회
  const queryTime = new Date(Date.now() - 10 * 60 * 1000);
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
      return NextResponse.json({ count: 0, message: "No lightning data" });
    }

    const lightnings = Array.isArray(items) ? items : [items];

    // DB에 저장
    const events = lightnings.map(
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
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      count: events.length,
      queryTime: dateTime,
    });
  } catch (err) {
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}
