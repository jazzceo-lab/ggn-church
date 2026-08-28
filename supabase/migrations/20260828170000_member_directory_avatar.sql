-- 쪽지함/게시판에서 다른 회원의 프로필 사진을 볼 수 있도록 member_directory 뷰에
-- avatar_path를 추가한다. 이 뷰는 이미 모든 로그인 회원에게 다른 회원의
-- display_name/district/title을 공개하고 있으므로(쪽지 상대 선택 등), avatar_path도
-- 같은 수준으로 공개한다.

create or replace view member_directory as
select id,
    coalesce(display_name, split_part(email, '@'::text, 1)) as display_name,
    district,
    title,
    avatar_path
from profiles;
