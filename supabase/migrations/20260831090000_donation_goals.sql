-- 헌금 목표 대비 달성률(온도계)을 위한 테이블.
-- donation_goals: 목표 하나(일반헌금/건축헌금)당 한 행. target_amount는 관리자가 직접 설정/수정.
-- donation_entries: 관리자가 매주 입력하는 금액. 합산해서 달성률을 계산한다(누적 총액을 직접 입력하지 않아도 됨).

create table if not exists donation_goals (
  key text primary key,
  title text not null,
  target_amount bigint not null default 0,
  updated_at timestamptz not null default now()
);

insert into donation_goals (key, title, target_amount) values
  ('general', '일반헌금 목표', 0),
  ('building', '건축헌금 목표', 0)
on conflict (key) do nothing;

create table if not exists donation_entries (
  id uuid primary key default gen_random_uuid(),
  goal_key text not null references donation_goals(key) on delete cascade,
  amount bigint not null,
  note text,
  created_at timestamptz not null default now()
);

alter table donation_goals enable row level security;
alter table donation_entries enable row level security;

drop policy if exists "donation_goals_select_authenticated" on donation_goals;
create policy "donation_goals_select_authenticated"
on donation_goals for select
using (auth.uid() is not null);

drop policy if exists "donation_goals_update_admin" on donation_goals;
create policy "donation_goals_update_admin"
on donation_goals for update
using (exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true));

drop policy if exists "donation_entries_select_authenticated" on donation_entries;
create policy "donation_entries_select_authenticated"
on donation_entries for select
using (auth.uid() is not null);

drop policy if exists "donation_entries_insert_admin" on donation_entries;
create policy "donation_entries_insert_admin"
on donation_entries for insert
with check (exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true));

drop policy if exists "donation_entries_delete_admin" on donation_entries;
create policy "donation_entries_delete_admin"
on donation_entries for delete
using (exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true));
