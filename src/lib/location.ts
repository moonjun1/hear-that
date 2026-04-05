const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

let cachedName: string | null = null;

export async function getAreaName(
  lat: number,
  lng: number
): Promise<string> {
  if (cachedName) return cachedName;
  if (!MAPBOX_TOKEN) return "내 주변";

  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=locality,place,neighborhood&language=ko&access_token=${MAPBOX_TOKEN}`
    );
    const data = await res.json();
    const feature = data.features?.[0];
    if (feature) {
      cachedName = feature.text as string;
      return cachedName!;
    }
  } catch {
    // ignore
  }
  return "내 주변";
}
