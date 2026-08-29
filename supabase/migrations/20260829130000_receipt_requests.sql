-- 기부금영수증 신청 내역. 개인정보(생년월일 등)가 포함되므로
-- 본인 신청 내역과 관리자만 볼 수 있게 RLS로 제한한다.
create table if not exists receipt_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  birth_date text not null,
  phone text not null,
  year_label text not null,
  status text not null default 'waiting' check (status in ('waiting', 'in_progress', 'done')),
  created_at timestamptz not null default now()
);

alter table receipt_requests enable row level security;

create policy "receipt_requests_insert_own"
on receipt_requests for insert
with check (auth.uid() = user_id);

create policy "receipt_requests_select_own_or_admin"
on receipt_requests for select
using (
  auth.uid() = user_id
  or exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true)
);

create policy "receipt_requests_update_admin"
on receipt_requests for update
using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true)
);
