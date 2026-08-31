import { supabase } from "@/lib/supabaseClient";

export async function loadMessageBookmarks(messageType, messageIds, userId) {
  if (!messageIds.length) return new Set();
  const { data, error } = await supabase
    .from("message_bookmarks")
    .select("message_id")
    .eq("message_type", messageType)
    .eq("user_id", userId)
    .in("message_id", messageIds);

  if (error) return new Set();
  return new Set(data.map((r) => r.message_id));
}

export async function toggleMessageBookmark(messageType, messageId, userId, bookmarked) {
  if (bookmarked) {
    return supabase
      .from("message_bookmarks")
      .delete()
      .eq("message_type", messageType)
      .eq("message_id", messageId)
      .eq("user_id", userId);
  }
  return supabase
    .from("message_bookmarks")
    .upsert(
      { message_type: messageType, message_id: messageId, user_id: userId },
      { onConflict: "message_type,message_id,user_id" }
    );
}
