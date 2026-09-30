-- 청년부 전용 메뉴 1단계: 권한 함수 + 청년부 주보.
-- 청년부 관리자 = 관리자 + 목회자(district='목회자') + 청년부 임원진(member_roles youth_officer).
-- 청년부 열람 = 청년부 회원 + 게시판 관리자(is_board_admin) + 청년부 관리자.

create or replace function public.can_manage_youth()
returns boolean
language sql
stable
security definer
set search_path = 'public'
as $$
  select exists (
    select 1 from profiles p
    where p.id = auth.uid() and (p.is_admin or p.district = '목회자')
  ) or exists (
    select 1 from member_roles r where r.user_id = auth.uid() and r.role_key = 'youth_officer'
  );
$$;

create or replace function public.can_view_youth()
returns boolean
language sql
stable
security definer
set search_path = 'public'
as $$
  select exists (
    select 1 from profiles p
    where p.id = auth.uid() and (p.district = '청년부' or p.is_board_admin)
  ) or public.can_manage_youth();
$$;

revoke execute on function public.can_manage_youth(), public.can_view_youth() from public, anon;
grant execute on function public.can_manage_youth(), public.can_view_youth() to authenticated;

-- 매주 텍스트 그대로 붙여넣는 청년부 주보. 날짜는 첫 줄 "(2026.09.27)"에서 앱이 뽑아 저장.
create table public.youth_bulletins (
  id bigint generated always as identity primary key,
  bulletin_date date not null,
  body text not null,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.youth_bulletins enable row level security;

create policy youth_bulletins_select on public.youth_bulletins
  for select to authenticated using (public.can_view_youth());
create policy youth_bulletins_manage on public.youth_bulletins
  for all to authenticated using (public.can_manage_youth()) with check (public.can_manage_youth());
create policy approved_members_only on public.youth_bulletins
  as restrictive for all to authenticated
  using (public.is_approved()) with check (public.is_approved());

grant select, insert, update, delete on public.youth_bulletins to authenticated;
