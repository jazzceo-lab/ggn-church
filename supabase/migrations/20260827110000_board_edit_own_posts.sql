-- 게시판 글 "수정" 기능을 위한 권한 정리.
--
-- 이전 마이그레이션(board_pinned_posts)에서 posts UPDATE 전체를 RESTRICTIVE 정책으로
-- "관리자/게시판 서브관리자만" 가능하게 좁혀뒀는데, 그땐 앱에 수정 기능 자체가 없어서
-- 문제가 안 됐지만 이제 "본인 글 수정" 기능이 생기면서 이 정책이 그것까지 막아버립니다.
--
-- 그래서 이 파일에서는:
-- 1) 예전의 관리자 전용 RESTRICTIVE UPDATE 정책을 제거하고,
-- 2) "본인 글이거나 관리자/게시판 서브관리자면 UPDATE 가능"이라는 일반 정책을 추가하고,
-- 3) is_pinned 값 변경만은 트리거로 별도 검사해서 "관리자/게시판 서브관리자만" 가능하게
--    유지합니다 (RLS 정책만으로는 "이 컬럼만 바뀌었는지"를 깔끔히 검사하기 어려워 트리거 사용).

drop policy if exists "pinned_posts_update" on posts;

drop policy if exists "posts_update_own_or_admin" on posts;
create policy "posts_update_own_or_admin"
on posts for update
using (
  auth.uid() = user_id
  or exists (
    select 1 from profiles p
    where p.id = auth.uid() and (p.is_admin = true or p.is_board_admin = true)
  )
)
with check (
  auth.uid() = user_id
  or exists (
    select 1 from profiles p
    where p.id = auth.uid() and (p.is_admin = true or p.is_board_admin = true)
  )
);

create or replace function enforce_post_pin_permission()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_pinned is distinct from old.is_pinned then
    if not exists (
      select 1 from profiles p
      where p.id = auth.uid() and (p.is_admin = true or p.is_board_admin = true)
    ) then
      raise exception '글 고정/고정 해제는 관리자만 할 수 있어요.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_post_pin_permission on posts;
create trigger trg_enforce_post_pin_permission
before update on posts
for each row
execute function enforce_post_pin_permission();
