-- 새 공지(popup_notices) 등록 시 send-push 엣지함수를 호출해 구독한 회원
-- 전체에게 알림을 보낸다. 기존 notify_new_post()/notify_new_message()와
-- 완전히 같은 방식(net.http_post로 send-push를 직접 호출).

create or replace function notify_new_notice()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $function$
begin
  perform net.http_post(
    url := 'https://ncskpuolqlkgckqtrcwb.supabase.co/functions/v1/send-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || 'sb_publishable_AdVsZfs6kH0uQ8bAP8tVSQ__ULT4pha'
    ),
    body := jsonb_build_object('table', 'popup_notices', 'record', row_to_json(new))
  );
  return new;
end;
$function$;

drop trigger if exists on_new_notice_send_push on popup_notices;
create trigger on_new_notice_send_push
after insert on popup_notices
for each row
execute function notify_new_notice();
