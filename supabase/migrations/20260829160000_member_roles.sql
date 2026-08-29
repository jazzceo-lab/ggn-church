-- 범용 권한(역할) 시스템.
-- 매번 새 요청마다 profiles에 컬럼을 추가하는 대신, 회원에게 역할 이름표를
-- 자유롭게 붙였다 뗄 수 있는 테이블 하나로 관리한다.
-- scope는 나중에 "1구역만" 같은 세분화가 필요할 때 쓰고, 지금 쓰는 역할들은 빈 문자열('').

create table if not exists member_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role_key text not null,
  scope text not null default '',
  created_at timestamptz not null default now(),
  primary key (user_id, role_key, scope)
);

alter table member_roles enable row level security;

drop policy if exists "member_roles_select_own_or_admin" on member_roles;
create policy "member_roles_select_own_or_admin"
on member_roles for select
using (
  auth.uid() = user_id
  or exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true)
);

drop policy if exists "member_roles_insert_admin" on member_roles;
create policy "member_roles_insert_admin"
on member_roles for insert
with check (
  exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true)
);

drop policy if exists "member_roles_delete_admin" on member_roles;
create policy "member_roles_delete_admin"
on member_roles for delete
using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true)
);

-- 다른 테이블의 RLS 정책에서 "이 역할을 가진 사람인가"를 한 줄로 체크할 때 쓰는 헬퍼.
create or replace function has_role(check_role text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from member_roles
    where user_id = auth.uid() and role_key = check_role
  );
$$;

-- 1) 교회건의(suggestion) 게시판: 답변(댓글)은 관리자 또는 pastor_reply 역할만 가능.
-- 기존 댓글 작성 정책은 그대로 두고, RESTRICTIVE로 "교회건의 글이면 이 조건도 만족해야 함"을 덧붙인다.
drop policy if exists "comments_pastor_reply_on_suggestion" on comments;
create policy "comments_pastor_reply_on_suggestion"
on comments as restrictive for insert
with check (
  not exists (
    select 1 from posts pt where pt.id = post_id and pt.category = 'suggestion'
  )
  or exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true)
  or has_role('pastor_reply')
);

-- 2) 설교·찬양의 "찬양팀"(video) 영상: media_manager 역할이 있으면 등록/삭제 가능.
-- 기존 관리자 전용 정책은 그대로 두고, video 타입에 한해 PERMISSIVE로 추가 허용(OR로 결합됨).
drop policy if exists "media_items_media_manager_insert" on media_items;
create policy "media_items_media_manager_insert"
on media_items for insert
to authenticated
with check (media_type = 'video' and has_role('media_manager'));

drop policy if exists "media_items_media_manager_delete" on media_items;
create policy "media_items_media_manager_delete"
on media_items for delete
to authenticated
using (media_type = 'video' and has_role('media_manager'));
