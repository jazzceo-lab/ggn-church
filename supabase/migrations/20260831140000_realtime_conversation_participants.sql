-- 그룹채팅 안읽음 배지(카톡처럼 "1" 숫자가 상대가 읽으면 사라지는 것)를 실시간으로
-- 반영하려면 conversation_participants.last_read_at 업데이트를 클라이언트가
-- postgres_changes로 구독할 수 있어야 하는데, 이 테이블이 realtime publication에
-- 빠져 있었다(group_chat 마이그레이션에서 conversation_messages만 추가함).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'conversation_participants'
  ) then
    alter publication supabase_realtime add table public.conversation_participants;
  end if;
end $$;
