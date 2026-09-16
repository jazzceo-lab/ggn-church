-- 오늘의 성경 알림 기능 전체 on/off (관리자용 마스터 스위치).
alter table daily_verse_settings add column if not exists enabled boolean not null default true;
