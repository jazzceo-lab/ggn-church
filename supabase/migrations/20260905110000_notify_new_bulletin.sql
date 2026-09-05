-- 새 주보(bulletins) 등록 시 send-push 엣지함수를 호출해 "주보 등록 알림"을 켜둔
-- 회원에게 알림을 보낸다. 이 알림 설정(notify_bulletin)은 이전에 회원정보 화면에 이미
-- 있었지만 실제로 쏘아주는 트리거가 없어서 동작하지 않고 있었다.
create or replace function notify_new_bulletin()
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
    body := jsonb_build_object('table', 'bulletins', 'record', row_to_json(new))
  );
  return new;
end;
$function$;

drop trigger if exists on_new_bulletin_send_push on bulletins;
create trigger on_new_bulletin_send_push
after insert on bulletins
for each row
execute function notify_new_bulletin();
