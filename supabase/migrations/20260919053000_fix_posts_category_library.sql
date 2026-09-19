-- boards.board_key는 자료실을 'library'로 쓰는데, posts_category_check 제약은
-- 'resources'만 허용해서 자료실 글쓰기가 항상 실패했다(20260829090000에서 이름이
-- 어긋남, 'resources' 카테고리는 실제로 쓰인 적 없음). 제약을 실제 board_key인
-- 'library'로 맞춘다.

alter table posts drop constraint if exists posts_category_check;
alter table posts add constraint posts_category_check
  check (category = any (array['prayer'::text, 'share'::text, 'help'::text, 'district'::text, 'library'::text]));
