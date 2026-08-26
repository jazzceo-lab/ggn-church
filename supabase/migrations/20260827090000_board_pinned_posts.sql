-- 게시판 글 상단 고정(공지) 기능.
--
-- is_pinned 컬럼을 추가하고, RESTRICTIVE 정책으로 "관리자 또는 게시판 서브관리자만
-- 이 컬럼을(사실상 posts 테이블 UPDATE 자체를) 바꿀 수 있음"을 강제합니다.
-- 지금 앱에는 일반 회원이 자기 글을 수정하는 기능 자체가 없으므로, posts UPDATE를
-- 관리자 전용으로 좁혀도 기존 기능에는 영향이 없습니다.

alter table posts add column if not exists is_pinned boolean not null default false;

alter table posts enable row level security;

drop policy if exists "pinned_posts_update" on posts;
create policy "pinned_posts_update"
on posts as restrictive for update
using (
  exists (
    select 1 from profiles p
    where p.id = auth.uid() and (p.is_admin = true or p.is_board_admin = true)
  )
)
with check (
  exists (
    select 1 from profiles p
    where p.id = auth.uid() and (p.is_admin = true or p.is_board_admin = true)
  )
);
