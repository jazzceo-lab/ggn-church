-- 청년부 전용 메뉴 추가: 청년부 일정 / 청년부 단톡방 / 청년부 공지 알림.
-- 권한 함수 can_view_youth()/can_manage_youth()는 20260930100000_youth_bulletins.sql.

-- 1) 청년부 일정: 기존 교회일정 테이블에 부서 구분만 추가(null = 교회 전체 일정).
alter table public.calendar_events add column if not exists department text
  check (department is null or department = '청년부');

-- 청년부 일정은 청년부·청년부 관리자만 보이게(교회 전체 일정은 기존대로 누구나).
create policy calendar_youth_visibility on public.calendar_events
  as restrictive for select
  using (department is null or public.can_view_youth());

create policy calendar_youth_insert on public.calendar_events
  for insert to authenticated
  with check (department = '청년부' and public.can_manage_youth());
create policy calendar_youth_update on public.calendar_events
  for update to authenticated
  using (department = '청년부' and public.can_manage_youth())
  with check (department = '청년부' and public.can_manage_youth());
create policy calendar_youth_delete on public.calendar_events
  for delete to authenticated
  using (department = '청년부' and public.can_manage_youth());

-- 2) 청년부 단톡방: 처음 부르는 사람이 방을 만들고, 이후엔 부르는 사람을 참여자로 넣어준다.
--    (기존 그룹채팅 RLS는 방 만든 사람만 참여자를 추가할 수 있어서 함수로 처리)
create table public.youth_chat (
  id int primary key default 1 check (id = 1),
  conversation_id uuid not null references conversations(id) on delete cascade
);
alter table public.youth_chat enable row level security;  -- 함수로만 접근

create or replace function public.join_youth_chat()
returns uuid
language plpgsql
security definer
set search_path = 'public'
as $$
declare
  conv uuid;
begin
  if not public.can_view_youth() or not public.is_approved() then
    raise exception 'not allowed';
  end if;

  select conversation_id into conv from youth_chat where id = 1;
  if conv is null then
    insert into conversations (name, created_by) values ('청년부 단톡방', auth.uid()) returning id into conv;
    insert into youth_chat (id, conversation_id) values (1, conv);
  end if;

  insert into conversation_participants (conversation_id, user_id)
  values (conv, auth.uid())
  on conflict do nothing;

  return conv;
end;
$$;
revoke execute on function public.join_youth_chat() from public, anon;
grant execute on function public.join_youth_chat() to authenticated;

-- 3) 청년부 공지 알림: 청년부 관리자가 등록하면 청년부 회원에게만 푸시(send-push youth_notices 분기).
create table public.youth_notices (
  id bigint generated always as identity primary key,
  title text not null,
  body text,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.youth_notices enable row level security;
create policy youth_notices_select on public.youth_notices for select to authenticated
  using (public.can_view_youth());
create policy youth_notices_manage on public.youth_notices for all to authenticated
  using (public.can_manage_youth()) with check (public.can_manage_youth());
create policy approved_members_only on public.youth_notices
  as restrictive for all to authenticated
  using (public.is_approved()) with check (public.is_approved());
grant select, insert, update, delete on public.youth_notices to authenticated;

create or replace function public.notify_youth_notice()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  perform net.http_post(
    url := 'https://ncskpuolqlkgckqtrcwb.supabase.co/functions/v1/send-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || 'sb_publishable_AdVsZfs6kH0uQ8bAP8tVSQ__ULT4pha'
    ),
    body := jsonb_build_object('table', 'youth_notices', 'record', row_to_json(new))
  );
  return new;
end;
$$;

create trigger on_youth_notice_send_push
after insert on public.youth_notices
for each row execute function public.notify_youth_notice();
