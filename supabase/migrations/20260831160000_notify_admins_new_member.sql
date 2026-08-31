-- 신규 회원가입 시 관리자들에게 GGN톡(1:1 메시지)으로 자동 안내한다.
-- profiles 행이 만들어지는 시점엔 이미(가입 시 auth 메타데이터를 옮겨주는
-- 기존 트리거를 통해) display_name/district가 채워져 있다고 가정한다.
-- 발신자를 신규 회원 본인으로 넣어서, 기존 쪽지 알림/토스트 로직을
-- 그대로 재사용한다(관리자가 토스트를 누르면 바로 그 회원과의 대화로 이동).

create or replace function notify_admins_new_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_row record;
  notice_body text;
begin
  notice_body := format(
    '🎉 새 회원이 가입했어요: %s (%s)%s',
    coalesce(new.display_name, '이름 미입력'),
    new.email,
    case when new.district is not null and new.district <> '' then format(' · 소속: %s', new.district) else '' end
  );

  for admin_row in select id from profiles where is_admin = true and id <> new.id loop
    insert into messages (sender_id, recipient_id, body)
    values (new.id, admin_row.id, notice_body);
  end loop;

  return new;
end;
$$;

drop trigger if exists trg_notify_admins_new_member on profiles;
create trigger trg_notify_admins_new_member
after insert on profiles
for each row
execute function notify_admins_new_member();
