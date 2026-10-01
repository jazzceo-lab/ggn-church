-- 관리자 "앱 설정"의 부서명·예배시간 등. 예전엔 app_settings(켜기/끄기 전용 key/value 테이블)에
-- 없는 칸으로 저장하려 해서 저장이 전혀 안 됐다. 단일 교회 앱이라 1행짜리 테이블로 둔다.
create table public.church_basic_settings (
  id int primary key default 1 check (id = 1),
  departments text,
  sunday_service_time text,
  wednesday_service_time text,
  sunday_service_name text,
  additional_settings text,
  updated_at timestamptz not null default now()
);

insert into public.church_basic_settings (id) values (1);

alter table public.church_basic_settings enable row level security;
create policy church_basic_settings_select on public.church_basic_settings for select using (true);
create policy church_basic_settings_admin_update on public.church_basic_settings for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

grant select on public.church_basic_settings to anon, authenticated;
grant update on public.church_basic_settings to authenticated;
