-- GGN톡(1:1/그룹) 메시지 예약전송. 공지사항 예약전송과 달리 메시지는 삽입되는 순간
-- 바로 노출되는 구조(is_active 같은 가시성 플래그가 없음)라, 같은 패턴(플래그+UPDATE
-- 트리거)을 그대로 쓰기보다 별도 대기 테이블에 넣어뒀다가 pg_cron이 시간 되면
-- 실제 messages/conversation_messages에 INSERT하는 방식을 쓴다. 실제 INSERT라서
-- 기존 on_new_message_send_push 트리거(DM)가 자연히 그대로 작동한다.
-- (그룹챗 conversation_messages엔 현재 push 트리거가 없음 — 기존 동작 그대로 유지,
-- 이 마이그레이션에서 새로 추가하지 않음)

create table scheduled_messages (
  id uuid primary key default gen_random_uuid(),
  message_type text not null check (message_type in ('dm', 'group')),
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid references auth.users(id) on delete cascade,
  conversation_id uuid references conversations(id) on delete cascade,
  body text,
  attachment_url text,
  attachment_name text,
  scheduled_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint scheduled_messages_target_check check (
    (message_type = 'dm' and recipient_id is not null and conversation_id is null) or
    (message_type = 'group' and conversation_id is not null and recipient_id is null)
  )
);

alter table scheduled_messages enable row level security;

create policy "본인 예약메시지만 조회" on scheduled_messages
  for select using (auth.uid() = sender_id);

create policy "본인 예약메시지만 등록" on scheduled_messages
  for insert with check (auth.uid() = sender_id);

create policy "본인 예약메시지만 취소" on scheduled_messages
  for delete using (auth.uid() = sender_id);

create index scheduled_messages_due_idx on scheduled_messages (scheduled_at);

create or replace function publish_scheduled_messages()
returns void
language plpgsql
security definer
set search_path = 'public'
as $function$
declare
  r record;
begin
  for r in select * from scheduled_messages where scheduled_at <= now() order by scheduled_at asc loop
    if r.message_type = 'dm' then
      insert into messages (sender_id, recipient_id, body, attachment_url, attachment_name)
      values (r.sender_id, r.recipient_id, r.body, r.attachment_url, r.attachment_name);
    else
      insert into conversation_messages (conversation_id, sender_id, body, attachment_url, attachment_name)
      values (r.conversation_id, r.sender_id, r.body, r.attachment_url, r.attachment_name);
    end if;
    delete from scheduled_messages where id = r.id;
  end loop;
end;
$function$;

select cron.schedule(
  'publish-scheduled-messages',
  '* * * * *',
  $$select publish_scheduled_messages();$$
);
