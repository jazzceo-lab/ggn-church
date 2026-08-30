-- 일회성 스크립트: 환영 쪽지 기능을 만들기 전에 이미 가입한 기존 회원들에게
-- 같은 환영 쪽지를 한 번만 발송한다. (이후 신규 가입자는 트리거가 자동 처리)
-- 주의: 다시 실행하면 모든 회원에게 중복 발송되니 한 번만 실행할 것.

with admin as (
  select id as admin_id from profiles where display_name = '관리자' limit 1
)
insert into messages (sender_id, recipient_id, body)
select
  admin.admin_id,
  p.id,
  coalesce(p.display_name, '교인') || '님, 길가는교회 앱에 오신 걸 환영합니다! 🙏' || E'\n\n' ||
    '이제 매주 주보와 교회 소식을 앱에서 바로 확인하실 수 있고, 구역게시판·기도게시판에서 서로 소식도 나눌 수 있어요.' || E'\n' ||
    '화면 오른쪽 위 종 모양(🔔)을 누르면 새 소식이 올라올 때 알림도 받으실 수 있어요.' || E'\n\n' ||
    '사용하다가 불편한 점 있으면 편하게 말씀해주세요. 반갑습니다!'
from profiles p
cross join admin
where p.id <> admin.admin_id;
