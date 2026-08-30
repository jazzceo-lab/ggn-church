-- 교회건의 게시판 글은 작성자 본인과 관리자/목회자(pastor_reply 역할)만 볼 수 있게 비공개 처리한다.
-- RESTRICTIVE라서 기존 정책들과 AND로 결합되어, 다른 카테고리에는 영향 없다.

drop policy if exists "posts_suggestion_private" on posts;
create policy "posts_suggestion_private"
on posts as restrictive for select
using (
  category <> 'suggestion'
  or user_id = auth.uid()
  or exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true)
  or has_role('pastor_reply')
);

-- 교회건의 글에 달린 댓글(답변)도 같은 대상에게만 보이게 한다.
drop policy if exists "comments_suggestion_private" on comments;
create policy "comments_suggestion_private"
on comments as restrictive for select
using (
  not exists (select 1 from posts pt where pt.id = post_id and pt.category = 'suggestion')
  or exists (select 1 from posts pt where pt.id = post_id and pt.user_id = auth.uid())
  or exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true)
  or has_role('pastor_reply')
);
