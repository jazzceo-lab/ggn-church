-- 오래된 푸시 구독(안 쓰는 기기) 자동 정리.
-- 지금까진 발송 실패(404/410)했을 때만 지워져서, 앱을 재설치하거나 폰을 바꿔서
-- 예전 구독이 조용히 죽어있는 경우엔 안 지워지고 계속 쌓였다(예: 관리자 1명이
-- 기기 6개). last_seen_at을 앱 켤 때마다(정상 구독 확인/재구독 시) 갱신하고,
-- 90일간 한 번도 안 보인 구독은 pg_cron으로 매일 자동 삭제한다.
alter table push_subscriptions add column if not exists last_seen_at timestamptz not null default now();

create extension if not exists pg_cron;

select cron.schedule(
  'cleanup-stale-push-subscriptions',
  '0 18 * * *', -- 매일 03:00 KST(UTC 18:00)
  $$delete from push_subscriptions where last_seen_at < now() - interval '90 days'$$
);
