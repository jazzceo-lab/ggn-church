-- 댓글이 달리면 send-push 엣지함수를 호출해 글쓴이에게 알림을 보낸다.
-- 기존 notify_new_post()/notify_new_message()와 완전히 같은 방식(net.http_post로
-- send-push를 직접 호출)이며, 실제 수신 대상 판단(자기 글 제외 등)은
-- send-push 함수 쪽의 table === "comments" 분기에서 처리한다.

create or replace function notify_new_comment()
returns trigger
language plpgsql
security definer
as $function$
begin
  perform net.http_post(
    url := 'https://ncskpuolqlkgckqtrcwb.supabase.co/functions/v1/send-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || 'sb_publishable_AdVsZfs6kH0uQ8bAP8tVSQ__ULT4pha'
    ),
    body := jsonb_build_object('table', 'comments', 'record', row_to_json(new))
  );
  return new;
end;
$function$;

drop trigger if exists on_new_comment_send_push on comments;
create trigger on_new_comment_send_push
after insert on comments
for each row
execute function notify_new_comment();
