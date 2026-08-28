-- 게시판(공지/게시판) 글이 로그인하지 않은 방문자에게도 보이던 문제를 막는다.
-- "글쓰기"는 원래도 로그인이 필요했지만 "읽기"는 카테고리 상관없이 막혀있지 않았음.
--
-- RESTRICTIVE 정책이라 기존 PERMISSIVE 정책들이 허용한 결과에 AND 조건으로 덧붙기 때문에,
-- 이미 있는 구역게시판 전용 정책(district_posts_select 등)은 그대로 유지된 채,
-- "로그인한 사용자만" 이라는 조건이 모든 카테고리에 추가로 걸린다.

alter table posts enable row level security;
alter table comments enable row level security;
alter table post_likes enable row level security;

drop policy if exists "posts_require_login" on posts;
create policy "posts_require_login"
on posts as restrictive for select
using (auth.uid() is not null);

drop policy if exists "comments_require_login" on comments;
create policy "comments_require_login"
on comments as restrictive for select
using (auth.uid() is not null);

drop policy if exists "post_likes_require_login" on post_likes;
create policy "post_likes_require_login"
on post_likes as restrictive for select
using (auth.uid() is not null);
