-- 청년부 전용 메뉴 2단계: 청년부 게시판(category='district', district='청년부')을
-- 청년부 회원 외에 게시판 관리자·목회자·청년부 임원진도 보고 쓰고 관리할 수 있게 한다
-- (can_view_youth / can_manage_youth, 20260930100000_youth_bulletins.sql).
-- 기존 구역 게시판 규칙(본인 구역 + 관리자)은 그대로 두고 청년부 조건만 OR로 추가.

drop policy if exists district_posts_select on public.posts;
create policy district_posts_select on public.posts
  as restrictive for select
  using (
    category <> 'district'
    or district = (select p.district from profiles p where p.id = auth.uid())
    or exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true)
    or (district = '청년부' and public.can_view_youth())
  );

drop policy if exists district_posts_insert on public.posts;
create policy district_posts_insert on public.posts
  as restrictive for insert
  with check (
    category <> 'district'
    or district = (select p.district from profiles p where p.id = auth.uid())
    or exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true)
    or (district = '청년부' and public.can_view_youth())
  );

-- 청년부 게시판 고정(공지) 글은 청년부 관리자도 쓸 수 있게.
drop policy if exists district_notice_insert on public.posts;
create policy district_notice_insert on public.posts
  as restrictive for insert
  with check (
    category <> 'district'
    or board_type <> 'notice'
    or exists (select 1 from profiles p where p.id = auth.uid() and (p.is_admin = true or p.is_board_admin = true))
    or (district = '청년부' and public.can_manage_youth())
  );

-- 청년부 관리자는 청년부 게시판 글 수정(고정 포함)·삭제 가능.
create policy posts_manage_youth_board on public.posts
  for update
  using (category = 'district' and district = '청년부' and public.can_manage_youth())
  with check (category = 'district' and district = '청년부' and public.can_manage_youth());
create policy posts_delete_youth_board on public.posts
  for delete
  using (category = 'district' and district = '청년부' and public.can_manage_youth());

drop policy if exists district_comments_select on public.comments;
create policy district_comments_select on public.comments
  as restrictive for select
  using (exists (
    select 1 from posts po where po.id = comments.post_id and (
      po.category <> 'district'
      or po.district = (select p.district from profiles p where p.id = auth.uid())
      or exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true)
      or (po.district = '청년부' and public.can_view_youth())
    )
  ));

drop policy if exists district_comments_insert on public.comments;
create policy district_comments_insert on public.comments
  as restrictive for insert
  with check (exists (
    select 1 from posts po where po.id = comments.post_id and (
      po.category <> 'district'
      or po.district = (select p.district from profiles p where p.id = auth.uid())
      or exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true)
      or (po.district = '청년부' and public.can_view_youth())
    )
  ));

create policy comments_delete_youth_board on public.comments
  for delete
  using (exists (
    select 1 from posts po
    where po.id = comments.post_id and po.category = 'district' and po.district = '청년부'
  ) and public.can_manage_youth());

drop policy if exists district_post_likes_select on public.post_likes;
create policy district_post_likes_select on public.post_likes
  as restrictive for select
  using (exists (
    select 1 from posts po where po.id = post_likes.post_id and (
      po.category <> 'district'
      or po.district = (select p.district from profiles p where p.id = auth.uid())
      or exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true)
      or (po.district = '청년부' and public.can_view_youth())
    )
  ));

drop policy if exists district_post_likes_insert on public.post_likes;
create policy district_post_likes_insert on public.post_likes
  as restrictive for insert
  with check (exists (
    select 1 from posts po where po.id = post_likes.post_id and (
      po.category <> 'district'
      or po.district = (select p.district from profiles p where p.id = auth.uid())
      or exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true)
      or (po.district = '청년부' and public.can_view_youth())
    )
  ));

-- 위 정책들은 비로그인(anon) 조회에도 평가되므로, anon이 권한 함수 호출에서 에러가 나지
-- 않게 실행만 허용(비로그인이면 둘 다 false를 반환).
grant execute on function public.can_manage_youth(), public.can_view_youth() to anon;
