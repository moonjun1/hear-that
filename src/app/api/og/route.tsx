import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const area = searchParams.get("area") || "서울";
  const count = searchParams.get("count") || "0";

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0a0a1a 0%, #111128 50%, #0a0a1a 100%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* Wave rings background */}
        <div
          style={{
            position: "absolute",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            border: "2px solid rgba(255, 200, 50, 0.15)",
            top: "115px",
            left: "400px",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            border: "2px solid rgba(255, 200, 50, 0.25)",
            top: "165px",
            left: "450px",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: "200px",
            height: "200px",
            borderRadius: "50%",
            border: "2px solid rgba(255, 200, 50, 0.35)",
            top: "215px",
            left: "500px",
            display: "flex",
          }}
        />

        {/* Title */}
        <div
          style={{
            fontSize: "72px",
            fontWeight: 800,
            color: "#ffc832",
            marginBottom: "16px",
            display: "flex",
          }}
        >
          ⚡ Hear That?
        </div>

        {/* Stats */}
        <div
          style={{
            fontSize: "36px",
            color: "#e0e0e0",
            marginBottom: "8px",
            display: "flex",
          }}
        >
          {area}에서 {count}명이 천둥에 반응!
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: "20px",
            color: "#888",
            display: "flex",
          }}
        >
          천둥이 치면 같은 동네 사람들의 반응을 실시간으로 본다
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
