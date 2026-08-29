-- 게시판에 "교회건의" 카테고리(suggestion)를 추가한다.
alter table posts drop constraint if exists posts_category_check;
alter table posts add constraint posts_category_check
  check (category in ('prayer', 'share', 'help', 'district', 'resources', 'suggestion'));
