-- 쪽지함에서 회원 선택/대화 상대 표시에 목사/장로 직함 뱃지를 보여주기 위해
-- member_directory 뷰에 title 컬럼을 추가한다. 기존 컬럼(id, display_name, district)은
-- 그대로 두고 title만 덧붙임.

create or replace view member_directory as
select id,
    coalesce(display_name, split_part(email, '@'::text, 1)) as display_name,
    district,
    title
from profiles;
