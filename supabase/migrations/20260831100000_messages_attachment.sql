-- 쪽지에 파일(이미지 등) 첨부 기능을 위한 컬럼 추가.
alter table messages add column if not exists attachment_url text;
alter table messages add column if not exists attachment_name text;
