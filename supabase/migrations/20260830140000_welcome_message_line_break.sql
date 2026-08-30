-- 환영 쪽지에서 "구역게시판·기도게시판에서 서로 소식도 나눌 수 있어요." 다음
-- 줄을 한 번 더 띄운다(기존엔 줄바꿈 1번이라 다음 문장과 붙어 보였음).

create or replace function send_welcome_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
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
    '화면 오른쪽 위 종 모양(🔔)을 누르면 새 소식이 올라올 때 알림도 받으실 수 있어요.' || E'\n\n' ||
    '사용하다가 불편한 점 있으면 편하게 말씀해주세요. 반갑습니다!';

  insert into messages (sender_id, recipient_id, body)
  values (admin_id, new.id, welcome_body);

  return new;
end;
$$;
