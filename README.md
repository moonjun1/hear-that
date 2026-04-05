# Hear That? ⚡

천둥이 치면 같은 동네 사람들의 반응을 실시간으로 본다.

## Features

- 실시간 이모지/텍스트 반응 (⚡😱🙉😂🌧️)
- 기상청 낙뢰 API 연동 (1분 자동 폴링)
- Thunder Wave 동심원 애니메이션 (343m/s 음속)
- 당근마켓 스타일 마커 클러스터링
- 지역 채팅 (같은 동네 사람들끼리)
- H3 기반 지역 묶기 (~9km 반경)
- 모바일 반응형 (하단 시트)
- PWA 지원

## Tech Stack

- Next.js 16 (App Router)
- Supabase (Postgres + Realtime)
- Mapbox GL JS
- H3 (geo-bucketing)
- Vercel (배포)

## Setup

```bash
bun install
cp .env.local.example .env.local
# .env.local에 키 입력
bun dev
```

## Environment Variables

| Key | Description |
|-----|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox access token |
| `KMA_API_KEY` | 기상청 Open API key (data.go.kr) |
