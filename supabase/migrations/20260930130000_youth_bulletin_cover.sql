-- 청년부 주보 표지 사진(주보마다 1장). attachments 버킷 경로.
alter table public.youth_bulletins add column if not exists cover_path text;
