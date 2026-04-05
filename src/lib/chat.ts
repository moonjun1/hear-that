import { supabase } from "./supabase";
import { getDeviceUUID } from "./device";
import type { ChatMessage } from "@/types";

export async function sendChat(
  h3Index: string,
  text: string
): Promise<{ success: boolean; error?: string }> {
  const deviceUuid = getDeviceUUID();

  const { error } = await supabase.from("chats").insert({
    text,
    h3_index: h3Index,
    device_uuid: deviceUuid,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export function subscribeToChat(
  h3Indexes: string[],
  onNewMessage: (msg: ChatMessage) => void
) {
  const h3Set = new Set(h3Indexes);
  const channelName = `chat-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const channel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "chats",
      },
      (payload) => {
        const msg = payload.new as ChatMessage;
        if (h3Set.has(msg.h3_index)) {
          onNewMessage(msg);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function fetchRecentChats(
  h3Indexes: string[],
  limit = 100
): Promise<ChatMessage[]> {
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("chats")
    .select("*")
    .in("h3_index", h3Indexes)
    .gte("created_at", since)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) return [];
  return data as ChatMessage[];
}
