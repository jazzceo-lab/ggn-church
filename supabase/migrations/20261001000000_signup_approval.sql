-- [미적용] 회원가입 관리자 승인제 - 2026년 10월경 활성화 예정.
-- app_settings.signup_approval_required 플래그로 켜고 끈다(기본 false = 지금과 동일하게 즉시 가입).
-- 켜면: 신규가입 profiles.approval_status가 'pending'으로 생성되고, AuthProvider가
-- pending 회원에게 앱 대신 승인대기 화면을 보여준다. 기존 가입자는 전부 'approved'로 시작하므로
-- 이 마이그레이션을 적용해도(플래그가 false인 한) 당장 아무 동작 변화는 없다.

insert into app_settings (key, value)
values ('signup_approval_required', false)
on conflict (key) do nothing;

alter table profiles add column if not exists approval_status text not null default 'approved';

alter table profiles drop constraint if exists profiles_approval_status_check;
alter table profiles add constraint profiles_approval_status_check
  check (approval_status in ('pending', 'approved', 'rejected'));

-- 기존 handle_new_user()에 승인 플래그 분기만 추가. 플래그가 꺼져 있으면 이전과 완전히 동일하게 동작.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $function$
declare
  approval_required boolean;
begin
  select value into approval_required from app_settings where key = 'signup_approval_required';

  insert into public.profiles (id, email, display_name, district, approval_status)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'display_name',
    new.raw_user_meta_data->>'district',
    case when coalesce(approval_required, false) then 'pending' else 'approved' end
  );
  return new;
end;
$function$;
