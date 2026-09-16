-- 매일 아침 "오늘의 성경" 이미지카드를 푸시로 보내는 기능.
-- 회원이 끌 수 있는 알림 설정 컬럼 추가 (다른 알림 토글과 동일한 패턴, 기본 켜짐).
alter table profiles add column if not exists notify_daily_verse boolean not null default true;

-- 매일 08:00 KST(UTC 23:00 전날)에 send-daily-verse 엣지함수를 호출.
-- Authorization은 다른 트리거들과 동일하게 publishable key 사용(verify_jwt=false로 배포할 예정).
create extension if not exists pg_cron;

select cron.schedule(
  'send-daily-verse-push',
  '0 23 * * *',
  $$
  select net.http_post(
    url := 'https://ncskpuolqlkgckqtrcwb.supabase.co/functions/v1/send-daily-verse',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer sb_publishable_AdVsZfs6kH0uQ8bAP8tVSQ__ULT4pha'
    ),
    body := '{}'::jsonb
  );
  $$
);
