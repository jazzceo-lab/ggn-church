-- 구역별 회비 계좌 정보(카카오뱅크 등). 계좌번호는 민감한 정보라 코드에 직접 넣지 않고
-- 관리자가 화면에서 등록하도록 테이블로 관리한다.
create table if not exists district_accounts (
  district text primary key,
  bank_name text not null default '카카오뱅크',
  account_number text not null,
  account_holder text,
  updated_at timestamptz not null default now()
);

alter table district_accounts enable row level security;

-- 로그인한 교인만 조회 가능 (비로그인 방문자에게는 안 보임).
drop policy if exists "district_accounts_select_authenticated" on district_accounts;
create policy "district_accounts_select_authenticated"
on district_accounts for select
using (auth.role() = 'authenticated');

drop policy if exists "district_accounts_admin_write" on district_accounts;
create policy "district_accounts_admin_write"
on district_accounts for all
using (exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true))
with check (exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true));
