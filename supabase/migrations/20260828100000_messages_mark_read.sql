-- 쪽지 읽음 처리(messages.read_at)가 실제로 저장되지 않는 문제 수정.
--
-- 지금까지 수신자가 대화방에 들어가면 클라이언트에서 messages.read_at을 업데이트
-- 시도했지만, 이를 허용하는 RLS 정책이 없어서 조용히 실패하고 있었을 가능성이 높습니다
-- (업데이트 결과 에러를 화면에 표시하지 않아서 눈에 안 띄었을 뿐).
--
-- 다른 컬럼(body, sender_id 등)은 손대지 못하게, read_at 컬럼 하나만 컬럼 단위로
-- authenticated에게 UPDATE 권한을 주고, RLS로 "내가 수신자인 쪽지만" 가능하게 제한합니다.

alter table messages enable row level security;

grant update (read_at) on messages to authenticated;

drop policy if exists "messages_recipient_mark_read" on messages;
create policy "messages_recipient_mark_read"
on messages for update
using (auth.uid() = recipient_id)
with check (auth.uid() = recipient_id);
