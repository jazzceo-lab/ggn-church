import { supabase } from "@/lib/supabaseClient";

export async function loadMessageReactions(messageType, messageIds, userId) {
  if (!messageIds.length) return {};
  const { data, error } = await supabase
    .from("message_reactions")
    .select("message_id, user_id, reaction_type")
    .eq("message_type", messageType)
    .in("message_id", messageIds);

  if (error) return {};

  const grouped = {};
  for (const r of data) {
    if (!grouped[r.message_id]) grouped[r.message_id] = { counts: {}, myReaction: null };
    const entry = grouped[r.message_id];
    entry.counts[r.reaction_type] = (entry.counts[r.reaction_type] ?? 0) + 1;
    if (r.user_id === userId) entry.myReaction = r.reaction_type;
  }
  return grouped;
}

export async function toggleMessageReaction(messageType, messageId, userId, myReaction, reactionType) {
  if (myReaction === reactionType) {
    return supabase
      .from("message_reactions")
      .delete()
      .eq("message_type", messageType)
      .eq("message_id", messageId)
      .eq("user_id", userId);
  }
  return supabase
    .from("message_reactions")
    .upsert(
      { message_type: messageType, message_id: messageId, user_id: userId, reaction_type: reactionType },
      { onConflict: "message_type,message_id,user_id" }
    );
}
