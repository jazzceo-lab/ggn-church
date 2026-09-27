-- 휴대폰 번호 가입 도입: 가입 시 넘어온 phone 메타데이터를 profiles.phone에도 저장.
-- (승인제 분기는 20261001000000_signup_approval.sql 그대로 유지)
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

  insert into public.profiles (id, email, display_name, district, phone, approval_status)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'display_name',
    new.raw_user_meta_data->>'district',
    new.raw_user_meta_data->>'phone',
    case when coalesce(approval_required, false) then 'pending' else 'approved' end
  );
  return new;
end;
$function$;
