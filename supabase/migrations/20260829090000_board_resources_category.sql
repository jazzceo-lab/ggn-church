-- 게시판에 "자료실" 카테고리(resources)를 추가한다.
-- posts.category 체크 제약에 'resources' 값을 허용하도록 갱신.

alter table posts drop constraint if exists posts_category_check;
alter table posts add constraint posts_category_check
  check (category in ('prayer', 'share', 'help', 'district', 'resources'));
