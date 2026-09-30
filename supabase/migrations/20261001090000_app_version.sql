-- 안드로이드 앱 업데이트 안내용 최신 버전 정보(1행). Play의 인앱 업데이트 확인은 테스트 트랙·
-- 스토어 캐시 때문에 안 뜨는 경우가 있어, 앱 버전(versionCode)이 이 값보다 낮으면 앱이 직접
-- "새 버전이 있어요" 안내를 띄운다. 새 AAB가 실제로 배포된 뒤 관리자가 번호를 올린다.
create table public.app_version (
  id int primary key default 1 check (id = 1),
  latest_version_code int not null,
  update_url text not null,
  updated_at timestamptz not null default now()
);

-- 비공개 테스트 중에는 테스트 참여 링크로 들어가야 업데이트 버튼이 보인다.
insert into public.app_version (latest_version_code, update_url)
values (9, 'https://play.google.com/apps/testing/shop.ggnch.twa');

alter table public.app_version enable row level security;

-- 로그인 전(승인대기 포함)에도 안내가 떠야 하므로 조회는 누구나.
create policy app_version_select on public.app_version for select using (true);
create policy app_version_admin_update on public.app_version for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

grant select on public.app_version to anon, authenticated;
grant update on public.app_version to authenticated;
