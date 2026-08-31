-- 관리자 회원관리 화면의 "가입회원" 숫자를 실시간으로 갱신하려면
-- profiles 테이블의 INSERT/DELETE를 postgres_changes로 구독할 수 있어야 한다.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'profiles'
  ) then
    alter publication supabase_realtime add table public.profiles;
  end if;
end $$;
