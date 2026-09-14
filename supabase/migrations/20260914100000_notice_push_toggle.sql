-- 공지 알림: 회원이 끌 수 있는 설정(notify_notice) + 관리자가 공지 등록 시
-- "앱 접속시에만 표시"할지 "전체회원 푸시로도 발송"할지 고를 수 있는 플래그(send_push).
alter table profiles add column if not exists notify_notice boolean not null default true;
alter table popup_notices add column if not exists send_push boolean not null default false;
