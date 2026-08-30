-- 간단한 앱 전역 설정용 키-값 테이블. 우선 기부금영수증 신청 기간 온/오프에 사용.
create table if not exists app_settings (
  key text primary key,
  value boolean not null default false
);

insert into app_settings (key, value)
values ('receipt_requests_open', true)
on conflict (key) do nothing;

alter table app_settings enable row level security;

drop policy if exists "app_settings_select_all" on app_settings;
create policy "app_settings_select_all"
on app_settings for select
using (true);

drop policy if exists "app_settings_update_admin" on app_settings;
create policy "app_settings_update_admin"
on app_settings for update
using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true)
);
