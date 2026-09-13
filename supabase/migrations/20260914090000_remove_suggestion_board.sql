-- 교회제안 게시판(suggestion 카테고리) 삭제에 따라 관련 스키마 정리.
-- posts/comments/post_attachments 데이터는 이미 0건 확인됨(2026-09-14).

drop policy if exists comments_pastor_reply_on_suggestion on comments;
drop policy if exists posts_suggestion_private on posts;
drop policy if exists comments_suggestion_private on comments;
drop policy if exists post_attachments_suggestion_private on post_attachments;

alter table posts drop constraint if exists posts_category_check;
alter table posts add constraint posts_category_check
  check (category = any (array['prayer'::text, 'share'::text, 'help'::text, 'district'::text, 'resources'::text]));
