-- 채팅 삭제를 하드 delete에서 소프트 delete로 바꾼다. 상대가 아직 안 읽은 내
-- 메시지만 삭제할 수 있고(기존 정책과 동일한 조건), 삭제해도 행은 남기고
-- deleted_at만 찍어서 상대 화면에도 "삭제된 메시지입니다"로 보이게 한다.

alter table messages add column if not exists deleted_at timestamptz;
alter table conversation_messages add column if not exists deleted_at timestamptz;

grant update (deleted_at) on messages to authenticated;
grant update (deleted_at) on conversation_messages to authenticated;

drop policy if exists "messages_soft_delete_before_read" on messages;
create policy "messages_soft_delete_before_read"
on messages for update
using (sender_id = auth.uid() and read_at is null)
with check (sender_id = auth.uid());

drop policy if exists "conversation_messages_soft_delete_before_read" on conversation_messages;
create policy "conversation_messages_soft_delete_before_read"
on conversation_messages for update
using (
  sender_id = auth.uid()
  and not exists (
    select 1 from conversation_participants cp
    where cp.conversation_id = conversation_messages.conversation_id
      and cp.user_id <> conversation_messages.sender_id
      and cp.last_read_at >= conversation_messages.created_at
  )
)
with check (sender_id = auth.uid());
