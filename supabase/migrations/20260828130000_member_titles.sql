-- 목사/장로 등 직함을 관리자가 회원(profiles)에 지정하고,
-- 글/댓글 작성 시점의 직함을 posts/comments에 스냅샷으로 저장해서
-- author_name과 함께 화면에 뱃지로 보여준다.
-- (author_name과 동일한 방식: 다른 회원의 profiles를 실시간 조회할 필요 없이
--  글쓴이 본인이 자기 profiles 행만 읽어서 작성 시점에 함께 저장)

alter table profiles add column if not exists title text;
alter table posts add column if not exists author_title text;
alter table comments add column if not exists author_title text;
