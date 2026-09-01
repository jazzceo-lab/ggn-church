-- 신규 회원가입 안내를 실제 쪽지(messages) 생성 방식에서 send-push 직접 호출
-- 방식으로 변경한다. 기존 방식은 신규 회원을 발신자로 한 1:1 쪽지를 만들어서,
-- 그 회원 본인도 자기 GGN톡 대화방에서 이 안내(본인 이메일·소속 등)를 볼 수
-- 있는 문제가 있었다. 이제는 messages 테이블을 전혀 건드리지 않고 관리자에게만
-- 푸시로 직접 보낸다(실제 발송 대상/문구는 send-push 함수의 table === "profiles"
-- 분기에서 정함).

create or replace function notify_admins_new_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  perform net.http_post(
    url := 'https://ncskpuolqlkgckqtrcwb.supabase.co/functions/v1/send-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || 'sb_publishable_AdVsZfs6kH0uQ8bAP8tVSQ__ULT4pha'
    ),
    body := jsonb_build_object('table', 'profiles', 'record', row_to_json(new))
  );
  return new;
end;
$function$;
