-- 오늘의 성경 알림 발송주기: 매일 / 주 1회(요일 지정) / 특정 날짜(1회성).
alter table daily_verse_settings add column if not exists frequency text not null default 'daily';
alter table daily_verse_settings drop constraint if exists daily_verse_settings_frequency_check;
alter table daily_verse_settings add constraint daily_verse_settings_frequency_check
  check (frequency in ('daily', 'weekly', 'once'));

-- 0=일요일 ~ 6=토요일 (frequency='weekly'일 때만 사용)
alter table daily_verse_settings add column if not exists weekly_day int;
alter table daily_verse_settings drop constraint if exists daily_verse_settings_weekly_day_check;
alter table daily_verse_settings add constraint daily_verse_settings_weekly_day_check
  check (weekly_day is null or (weekly_day >= 0 and weekly_day <= 6));

-- frequency='once'일 때만 사용. 발송되면 자동으로 null로 비워져서 같은 설정으로
-- 다시 발송되지 않는다(매년 반복 X, 정말 그 날 1회만).
alter table daily_verse_settings add column if not exists once_date date;
