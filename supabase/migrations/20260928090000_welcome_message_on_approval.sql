-- 환영 쪽지를 "가입 순간"이 아니라 "관리자 승인 순간"에 보낸다. 승인제에서는 가입 직후엔
-- 앱을 못 쓰는데 쪽지·알림부터 가던 문제 수정. 승인제를 꺼서 바로 approved로 가입되는
-- 경우엔 예전처럼 가입 즉시 보낸다. 🔔 알림 안내 문구는 제거(앱은 OS 설정으로 알림 관리).
create or replace function public.send_welcome_message()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $function$
declare
  admin_id uuid;
  welcome_body text;
begin
  select id into admin_id from profiles where display_name = '관리자' limit 1;
  if admin_id is null or admin_id = new.id then
    return new;
  end if;

  welcome_body := coalesce(new.display_name, '교인') || '님, 길가는교회 앱에 오신 걸 환영합니다! 🙏' || E'\n\n' ||
    '이제 매주 주보와 교회 소식을 앱에서 바로 확인하실 수 있고, 구역게시판·기도게시판에서 서로 소식도 나눌 수 있어요.' || E'\n\n' ||
    '사용하다가 불편한 점 있으면 편하게 말씀해주세요. 반갑습니다!';

  insert into messages (sender_id, recipient_id, body)
  values (admin_id, new.id, welcome_body);

  return new;
end;
$function$;

drop trigger if exists trg_send_welcome_message on profiles;

create trigger trg_send_welcome_message
after insert on profiles
for each row
when (new.approval_status = 'approved')
execute function send_welcome_message();

create trigger trg_send_welcome_message_on_approval
after update of approval_status on profiles
for each row
when (old.approval_status is distinct from 'approved' and new.approval_status = 'approved')
execute function send_welcome_message();
