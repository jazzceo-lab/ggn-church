-- 게시판 알림을 서브게시판(카테고리)별로 개별 설정할 수 있도록
-- notify_board 하나를 구역/기도/나눔/건의 4개 컬럼으로 분리한다.
-- 기존 notify_board 값을 4개 컬럼에 그대로 옮겨서 사용자가 꺼둔 설정은 유지한다.

alter table profiles add column if not exists notify_board_district boolean not null default true;
alter table profiles add column if not exists notify_board_prayer boolean not null default true;
alter table profiles add column if not exists notify_board_share boolean not null default true;
alter table profiles add column if not exists notify_board_suggestion boolean not null default true;

update profiles set
  notify_board_district = notify_board,
  notify_board_prayer = notify_board,
  notify_board_share = notify_board,
  notify_board_suggestion = notify_board;

alter table profiles drop column if exists notify_board;
