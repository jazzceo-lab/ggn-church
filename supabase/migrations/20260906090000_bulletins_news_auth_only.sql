-- 주보의 "교회소식"은 교인 개인정보(이사, 입대 등)가 포함되어 있어, 화면에서만
-- 가리는 게 아니라 데이터베이스 단에서도 비로그인 사용자에게는 아예 내려가지 않게 한다.

-- 1) 원본 테이블은 로그인한 사용자만 조회 가능하도록 좁힌다.
drop policy if exists "bulletins_select_all" on bulletins;
create policy "bulletins_select_all"
on bulletins for select
using (auth.role() = 'authenticated');

-- 2) 비로그인 사용자(및 로그인 사용자 모두)가 안전하게 쓸 수 있는 뷰. content에서
-- news만 제거해서 내려준다. security_invoker=false로 만들어서, 뷰를 소유한 역할의
-- 권한으로 원본 테이블을 읽어 anon에게도 news를 뺀 나머지는 보여줄 수 있게 한다.
create or replace view bulletins_public
with (security_invoker = false)
as
select id, issue, bulletin_date, (content - 'news') as content
from bulletins;

grant select on bulletins_public to anon, authenticated;
