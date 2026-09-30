-- 청년부 전용 메뉴 3단계: 신청·설문 (easychurch-app 20260925200000_forms.sql 이식).
-- 단일 교회라 church_id 없음. 권한: 보기·응답 = can_view_youth(), 등록·수정·삭제·응답 열람 = can_manage_youth().
-- questions = [{id, label, type: text|choice|multi, options?: [..], required?: bool}]
create table public.forms (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  kind text not null default 'signup' check (kind in ('signup', 'survey')),
  questions jsonb not null default '[]',
  is_open boolean not null default true,
  closes_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.form_responses (
  form_id uuid not null references forms(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  answers jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (form_id, user_id)
);

alter table public.forms enable row level security;
alter table public.form_responses enable row level security;

create policy forms_select on public.forms for select to authenticated
  using (public.can_view_youth());
create policy forms_manage on public.forms for all to authenticated
  using (public.can_manage_youth()) with check (public.can_manage_youth());

-- 응답: 본인 것 + 청년부 관리자는 전체 조회. 쓰기는 마감 전 열린 설문에 본인 것만.
create policy form_responses_select on public.form_responses for select to authenticated
  using (user_id = auth.uid() or public.can_manage_youth());
create policy form_responses_insert on public.form_responses for insert to authenticated
  with check (
    user_id = auth.uid()
    and public.can_view_youth()
    and exists (select 1 from forms f where f.id = form_id and f.is_open and (f.closes_at is null or f.closes_at > now()))
  );
create policy form_responses_update on public.form_responses for update to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (select 1 from forms f where f.id = form_id and f.is_open and (f.closes_at is null or f.closes_at > now()))
  );
create policy form_responses_delete on public.form_responses for delete to authenticated
  using (user_id = auth.uid() or public.can_manage_youth());

create policy approved_members_only on public.forms
  as restrictive for all to authenticated
  using (public.is_approved()) with check (public.is_approved());
create policy approved_members_only on public.form_responses
  as restrictive for all to authenticated
  using (public.is_approved()) with check (public.is_approved());

grant select, insert, update, delete on public.forms, public.form_responses to authenticated;
