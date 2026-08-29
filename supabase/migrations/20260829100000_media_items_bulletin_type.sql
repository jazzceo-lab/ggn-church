-- media_items.media_type 체크 제약에 'bulletin'이 빠져 있어서 주보 이미지 등록이
-- 실패하던 문제를 고친다. 기존 audio/video는 그대로 유지.

alter table media_items drop constraint if exists media_items_media_type_check;
alter table media_items add constraint media_items_media_type_check
  check (media_type = any (array['audio'::text, 'video'::text, 'bulletin'::text]));
