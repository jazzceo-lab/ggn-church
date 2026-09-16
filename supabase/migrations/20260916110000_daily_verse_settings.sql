-- 오늘의 성경 알림: 관리자가 발송시간을 조절하고, 원할 때만 특정 성구로
-- 강제 지정할 수 있게 하는 설정 테이블(항상 1행만 존재).
-- pg_cron을 5분마다 깨우고, 엣지함수가 send_time과 현재 KST 시각을 비교해서
-- 실제로 보낼지 판단한다(동적으로 cron 스케줄 자체를 바꾸는 것보다 훨씬 단순함).
create table if not exists daily_verse_settings (
  id int primary key default 1,
  send_time text not null default '08:00', -- KST HH:MM
  override_ref text,
  override_text text,
  last_sent_date date,
  constraint daily_verse_settings_single_row check (id = 1)
);
insert into daily_verse_settings (id) values (1) on conflict (id) do nothing;

alter table daily_verse_settings enable row level security;

drop policy if exists "daily_verse_settings_select_admin" on daily_verse_settings;
create policy "daily_verse_settings_select_admin"
on daily_verse_settings for select
using (exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true));

drop policy if exists "daily_verse_settings_update_admin" on daily_verse_settings;
create policy "daily_verse_settings_update_admin"
on daily_verse_settings for update
using (exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true));

-- 기존 "매일 08:00 고정 발송" 스케줄을 "5분마다 깨워서 시간 일치 여부 확인"으로 교체.
select cron.unschedule('send-daily-verse-push');
select cron.schedule(
  'send-daily-verse-push',
  '*/5 * * * *',
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
