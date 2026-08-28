-- 찬양대 영상처럼 용량이 커서 직접 업로드하기 어려운 영상은
-- 네이버 마이박스 등 외부 클라우드 공유 링크(다운로드 금지 설정)로 등록할 수 있도록
-- media_items에 외부 링크 컬럼을 추가한다. 외부 링크로 등록하는 경우 file_path는 비워둔다.

alter table media_items add column if not exists external_url text;
alter table media_items alter column file_path drop not null;
