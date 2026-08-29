-- 관리자가 회원 관리 화면에서 "누가 알림을 켜뒀는지" 볼 수 있도록,
-- push_subscriptions에 관리자용 전체 조회 정책을 추가한다.
-- 기존 "본인 것만 조회 가능" 정책은 그대로 둔다 (PERMISSIVE라서 OR로 합쳐짐).

drop policy if exists "push_subscriptions_admin_select" on push_subscriptions;
create policy "push_subscriptions_admin_select"
on push_subscriptions for select
using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true)
);
