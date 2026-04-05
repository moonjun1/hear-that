import { supabase } from "./supabase";
import { getDeviceUUID } from "./device";
import { getH3Index } from "./geo";
import type { Reaction } from "@/types";

const COOLDOWN_KEY = "hear-that-last-reaction";
const COOLDOWN_MS = 30_000;

function isOnCooldown(): boolean {
  const last = localStorage.getItem(COOLDOWN_KEY);
  if (!last) return false;
  return Date.now() - parseInt(last, 10) < COOLDOWN_MS;
}

function setCooldown(): void {
  localStorage.setItem(COOLDOWN_KEY, Date.now().toString());
}

export async function submitReaction(
  lat: number,
  lng: number,
  emoji: string,
  text?: string
): Promise<{ success: boolean; error?: string }> {
  if (isOnCooldown()) {
    return { success: false, error: "30초 후 다시 시도해주세요" };
  }

  const deviceUuid = getDeviceUUID();
  const h3Index = getH3Index(lat, lng);

  const { error } = await supabase.from("reactions").insert({
    lat,
    lng,
    emoji,
    text: text || null,
    h3_index: h3Index,
    device_uuid: deviceUuid,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  setCooldown();
  return { success: true };
}

export function subscribeToReactions(
  h3Indexes: string[],
  onNewReaction: (reaction: Reaction) => void
) {
  const channels = h3Indexes.map((h3Index) =>
    supabase
      .channel(`reactions-${h3Index}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "reactions",
          filter: `h3_index=eq.${h3Index}`,
        },
        (payload) => {
          onNewReaction(payload.new as Reaction);
        }
      )
      .subscribe()
  );

  return () => {
    channels.forEach((ch) => supabase.removeChannel(ch));
  };
}

export async function fetchRecentReactions(
  h3Indexes: string[],
  limit = 50
): Promise<Reaction[]> {
  const { data, error } = await supabase
    .from("reactions")
    .select("*")
    .in("h3_index", h3Indexes)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return data as Reaction[];
}
