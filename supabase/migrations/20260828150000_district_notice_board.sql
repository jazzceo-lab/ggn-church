-- 구역게시판 안에 "구역공지" 소게시판을 추가한다.
--
-- posts.board_type으로 같은 category='district' 글을 "구역공지"(notice)와
-- "구역이야기"(general)로 나눈다. district_posts_insert 등 기존 RESTRICTIVE 정책은
-- 그대로 유지한 채, "구역공지 글은 관리자/게시판 서브관리자만 쓸 수 있다"는 조건만
-- RESTRICTIVE INSERT 정책으로 추가한다 (기존 정책들과 AND로 결합됨).

alter table posts add column if not exists board_type text not null default 'general';

alter table posts drop constraint if exists posts_board_type_check;
alter table posts add constraint posts_board_type_check
  check (board_type in ('general', 'notice'));

alter table posts enable row level security;

drop policy if exists "district_notice_insert" on posts;
create policy "district_notice_insert"
on posts as restrictive for insert
with check (
  category <> 'district'
  or board_type <> 'notice'
  or exists (
    select 1 from profiles p
    where p.id = auth.uid() and (p.is_admin = true or p.is_board_admin = true)
  )
);
