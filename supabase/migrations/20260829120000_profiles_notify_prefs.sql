-- 회원이 알림 종류별로 켜고 끌 수 있도록 profiles에 세부 알림 설정 컬럼을 추가한다.
-- 기본값 true (지금까지처럼 전체 알림을 받는 상태 유지, 새로 끄고 싶은 사람만 끄면 됨).

alter table profiles add column if not exists notify_messages boolean not null default true;
alter table profiles add column if not exists notify_bulletin boolean not null default true;
alter table profiles add column if not exists notify_board boolean not null default true;
