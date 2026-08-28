import { supabase } from "@/lib/supabaseClient";

// profiles.avatar_path(스토리지 경로)를 공개 URL로 바꾼다. 경로가 없으면 null.
export function avatarUrl(path) {
  if (!path) return null;
  return supabase.storage.from("attachments").getPublicUrl(path).data.publicUrl;
}
