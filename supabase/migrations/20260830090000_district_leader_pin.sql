-- 구역게시판의 "구역공지/구역이야기" 구분을 없애고, 구역장이 아무 글이나
-- "고정"(공지)으로 올릴 수 있게 한다. district_leader 역할(scope=구역명)을
-- member_roles에 부여받은 사람이 자기 구역 글에서만 이 권한을 갖는다.

create or replace function has_role_scope(check_role text, check_scope text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from member_roles
    where user_id = auth.uid() and role_key = check_role and scope = check_scope
  );
$$;

-- 구역장이 자기 구역 글을 UPDATE(고정 여부 변경)할 수 있도록 PERMISSIVE 정책 추가.
-- 기존 posts_update_own_or_admin 정책은 그대로 두고 OR로 결합됨.
drop policy if exists "posts_update_district_leader" on posts;
create policy "posts_update_district_leader"
on posts for update
using (
  category = 'district' and has_role_scope('district_leader', district)
)
with check (
  category = 'district' and has_role_scope('district_leader', district)
);

-- 트리거 갱신: (1) 구역장도 고정 여부를 바꿀 수 있게 허용하고,
-- (2) 구역장이 본인 글이 아닌 글에서 고정 여부 외 다른 내용을 바꾸는 것은 차단한다.
create or replace function enforce_post_pin_permission()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_privileged boolean;
  is_scoped_leader boolean;
begin
  select exists (
    select 1 from profiles p
    where p.id = auth.uid() and (p.is_admin = true or p.is_board_admin = true)
  ) into is_privileged;

  is_scoped_leader := old.category = 'district' and has_role_scope('district_leader', old.district);

  if new.is_pinned is distinct from old.is_pinned then
    if not (is_privileged or is_scoped_leader) then
      raise exception '글 고정/고정 해제는 관리자만 할 수 있어요.';
    end if;
  end if;

  if not is_privileged and auth.uid() <> old.user_id and is_scoped_leader then
    if (new.title, new.body, new.category, new.district)
       is distinct from (old.title, old.body, old.category, old.district) then
      raise exception '이 글을 수정할 권한이 없어요.';
    end if;
  end if;

  return new;
end;
$$;
