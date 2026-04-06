import { supabase } from "./supabase";
import { getDeviceUUID } from "./device";
import { getH3Index } from "./geo";
import type { Reaction } from "@/types";

const COOLDOWN_KEY = "hear-that-last-reaction";
const COOLDOWN_MS = 10_000; // 10초

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
    return { success: false, error: "10초 후 다시 시도해주세요" };
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
  // 단일 채널로 전체 reactions INSERT 구독, 클라이언트에서 h3 필터링
  const h3Set = new Set(h3Indexes);

  // 유니크 채널명으로 중복 구독 방지
  const channelName = `reactions-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const channel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "reactions",
      },
      (payload) => {
        const reaction = payload.new as Reaction;
        if (h3Set.has(reaction.h3_index)) {
          onNewReaction(reaction);
        }
      }
    )
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        console.log("[hear-that] Realtime reactions connected");
      } else if (status === "CHANNEL_ERROR") {
        console.error("[hear-that] Realtime reactions error");
      }
    });

  return () => {
    supabase.removeChannel(channel);
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
