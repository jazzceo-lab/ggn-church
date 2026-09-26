-- 공지사항 예약전송: scheduled_at을 미래로 지정하면 등록 시점엔 비활성 상태로만
-- 저장하고, pg_cron이 1분마다 확인해서 시간이 되면 활성화한다. 활성화(false→true)
-- 시점에 기존 notify_new_notice() 트리거를 재사용해 푸시를 보낸다 — 즉시발송(INSERT
-- 트리거)과 예약발송(UPDATE 트리거) 모두 같은 함수로 처리.

alter table popup_notices add column if not exists scheduled_at timestamptz;

drop trigger if exists on_notice_activated_send_push on popup_notices;
create trigger on_notice_activated_send_push
after update on popup_notices
for each row
when (old.is_active = false and new.is_active = true)
execute function notify_new_notice();

create or replace function publish_scheduled_notices()
returns void
language plpgsql
security definer
set search_path = 'public'
as $function$
declare
  due_id bigint;
begin
  select id into due_id
  from popup_notices
  where scheduled_at is not null and scheduled_at <= now() and is_active = false
  order by scheduled_at asc
  limit 1;

  if due_id is not null then
    update popup_notices set is_active = false where is_active = true;
    update popup_notices set is_active = true where id = due_id;
  end if;
end;
$function$;

select cron.schedule(
  'publish-scheduled-notices',
  '* * * * *',
  $$select publish_scheduled_notices();$$
);
