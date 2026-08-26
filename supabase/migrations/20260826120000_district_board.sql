-- 구역 전용 게시판(posts.category = 'district')을 위한 스키마 + 접근 제어.
--
-- 이 파일에 있는 정책은 모두 RESTRICTIVE로 만들어서, 기존에 posts/comments/post_likes에
-- 걸려 있던 (알 수 없는) 다른 SELECT/INSERT 정책은 전혀 건드리지 않습니다.
-- RESTRICTIVE 정책은 기존 PERMISSIVE 정책들이 허용한 결과에 AND 조건으로 덧붙기 때문에,
-- district 카테고리가 아닌 글(기도/나눔/앱사용관련)에는 아무 영향이 없고,
-- district 카테고리 글에 대해서만 "같은 구역 소속이거나 관리자" 조건을 추가로 요구합니다.
--
-- Supabase 대시보드 > SQL Editor에서 이 파일 내용을 그대로 실행하면 적용됩니다.

alter table posts add column if not exists district text;

-- category 값에 체크 제약이 걸려 있다면(테이블 생성 시 기본 이름) 'district'도 허용하도록 갱신.
-- 제약이 없거나 이름이 다르면 drop 문은 조용히 무시됩니다.
alter table posts drop constraint if exists posts_category_check;
alter table posts add constraint posts_category_check
  check (category in ('prayer', 'share', 'help', 'district'));

alter table posts enable row level security;
alter table comments enable row level security;
alter table post_likes enable row level security;

drop policy if exists "district_posts_select" on posts;
create policy "district_posts_select"
on posts as restrictive for select
using (
  category <> 'district'
  or district = (select p.district from profiles p where p.id = auth.uid())
  or exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true)
);

drop policy if exists "district_posts_insert" on posts;
create policy "district_posts_insert"
on posts as restrictive for insert
with check (
  category <> 'district'
  or district = (select p.district from profiles p where p.id = auth.uid())
  or exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true)
);

drop policy if exists "district_comments_select" on comments;
create policy "district_comments_select"
on comments as restrictive for select
using (
  exists (
    select 1 from posts po
    where po.id = comments.post_id
      and (
        po.category <> 'district'
        or po.district = (select p.district from profiles p where p.id = auth.uid())
        or exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true)
      )
  )
);

drop policy if exists "district_comments_insert" on comments;
create policy "district_comments_insert"
on comments as restrictive for insert
with check (
  exists (
    select 1 from posts po
    where po.id = comments.post_id
      and (
        po.category <> 'district'
        or po.district = (select p.district from profiles p where p.id = auth.uid())
        or exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true)
      )
  )
);

drop policy if exists "district_post_likes_select" on post_likes;
create policy "district_post_likes_select"
on post_likes as restrictive for select
using (
  exists (
    select 1 from posts po
    where po.id = post_likes.post_id
      and (
        po.category <> 'district'
        or po.district = (select p.district from profiles p where p.id = auth.uid())
        or exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true)
      )
  )
);

drop policy if exists "district_post_likes_insert" on post_likes;
create policy "district_post_likes_insert"
on post_likes as restrictive for insert
with check (
  exists (
    select 1 from posts po
    where po.id = post_likes.post_id
      and (
        po.category <> 'district'
        or po.district = (select p.district from profiles p where p.id = auth.uid())
        or exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true)
      )
  )
);
