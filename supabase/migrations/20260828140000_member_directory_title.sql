-- 쪽지함에서 회원 선택/대화 상대 표시에 목사/장로 직함 뱃지를 보여주기 위해
-- member_directory 뷰에 title 컬럼을 추가한다. 기존 컬럼(id, display_name, district)은
-- 그대로 두고 title만 덧붙임.
--
-- 운영 DB의 member_directory는 마이그레이션 이전에 Studio에서 수동으로 만들어져
-- 여기서 가정하는 컬럼 구성과 다를 수 있다. create or replace view는 기존 컬럼을
-- 제거하는 걸 허용하지 않으므로(SQLSTATE 42P16), drop 후 다시 만든다.
drop view if exists member_directory;

create view member_directory as
select id,
    coalesce(display_name, split_part(email, '@'::text, 1)) as display_name,
    district,
    title
from profiles;
