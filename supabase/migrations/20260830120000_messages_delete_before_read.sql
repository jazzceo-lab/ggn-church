-- 쪽지는 상대방이 읽기 전까지만 삭제(취소)할 수 있게 한다.
-- RESTRICTIVE라서 기존 삭제 정책(본인 글만 삭제 가능 등)에 조건이 추가로 걸린다.

drop policy if exists "messages_delete_before_read" on messages;
create policy "messages_delete_before_read"
on messages as restrictive for delete
using (read_at is null);
