-- 설교 음성은 정식 교회 승인 전까지 관리자만 볼 수 있게 임시로 제한한다.
-- RESTRICTIVE라서 기존 SELECT 정책에 조건이 추가로 걸리고, audio가 아닌
-- 콘텐츠(찬양팀 영상, 주보 이미지 등)는 전혀 영향이 없다.

drop policy if exists "media_items_audio_admin_only" on media_items;
create policy "media_items_audio_admin_only"
on media_items as restrictive for select
using (
  media_type <> 'audio'
  or exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true)
);
