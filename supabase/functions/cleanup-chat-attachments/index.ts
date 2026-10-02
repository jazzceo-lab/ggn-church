// 90일 지난 채팅(1:1·단체) 사진·동영상 파일을 저장소에서 지우고, 메시지에는 이름만 남긴다
// (attachment_url = null → 화면에 "보관 기간이 지나 삭제된 파일"로 표시).
// 전달(포워드)된 메시지는 원본과 같은 파일을 공유하므로, 그 파일을 쓰는 메시지가
// 모두 90일이 지났을 때만 지운다. 게시판 첨부는 기록용이라 대상 아님.
import { createClient } from "jsr:@supabase/supabase-js@2";

const RETENTION_DAYS = 90;
const MEDIA = /\.(jpe?g|png|gif|webp|avif|heic|bmp|mp4|mov|m4v|webm|3gp|avi|mkv)$/i;
const PREFIX = "/storage/v1/object/public/attachments/";
const TABLES = ["messages", "conversation_messages"];

Deno.serve(async () => {
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 864e5).toISOString();

  const old: { table: string; id: string; url: string }[] = [];
  for (const table of TABLES) {
    const { data, error } = await sb.from(table).select("id, attachment_url, attachment_name")
      .not("attachment_url", "is", null).lt("created_at", cutoff).limit(500);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    for (const r of data ?? []) {
      if (MEDIA.test(r.attachment_name ?? "") && r.attachment_url.includes(PREFIX)) {
        old.push({ table, id: r.id, url: r.attachment_url });
      }
    }
  }
  if (!old.length) return Response.json({ deleted: 0 });

  // 최근 메시지(전달본 등)가 아직 쓰는 파일은 건너뜀
  const urls = [...new Set(old.map((o) => o.url))];
  const inUse = new Set<string>();
  for (const table of TABLES) {
    const { data } = await sb.from(table).select("attachment_url").in("attachment_url", urls).gte("created_at", cutoff);
    for (const r of data ?? []) inUse.add(r.attachment_url);
  }
  const targets = old.filter((o) => !inUse.has(o.url));
  const paths = [...new Set(targets.map((o) => decodeURIComponent(o.url.split(PREFIX)[1])))];
  if (!paths.length) return Response.json({ deleted: 0 });

  const { error: rmError } = await sb.storage.from("attachments").remove(paths);
  if (rmError) return Response.json({ error: rmError.message }, { status: 500 });

  for (const table of TABLES) {
    const ids = targets.filter((o) => o.table === table).map((o) => o.id);
    if (ids.length) await sb.from(table).update({ attachment_url: null }).in("id", ids);
  }
  return Response.json({ deleted: paths.length, messages: targets.length });
});
