-- 회원가입 승인제를 서버(DB)에서도 강제한다. 지금까지는 앱 화면(AuthProvider)만
-- 승인대기 화면으로 막고 있어서, 앱을 거치지 않고 API로 직접 요청하면 승인 전에도
-- 데이터를 읽고 쓸 수 있었다.
--
-- 방식: 테이블마다 기존 정책은 그대로 두고, "로그인한 사용자는 승인된 회원이어야 한다"는
-- RESTRICTIVE 정책을 하나씩 덧붙인다(RESTRICTIVE는 기존 허용 정책과 AND로 결합됨).
-- 비로그인(anon) 공개 조회는 영향 없음. 트리거/cron(security definer)도 영향 없음.

create or replace function public.is_approved()
returns boolean
language sql
stable
security definer
set search_path = 'public'
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and approval_status = 'approved'
  );
$$;

-- 승인대기 회원도 해야 하는 일: 본인 프로필 조회(승인상태 확인), 알림 기기 등록.
create policy approved_members_only on public.profiles
  as restrictive for all to authenticated
  using (public.is_approved() or id = auth.uid())
  with check (public.is_approved() or id = auth.uid());

create policy approved_members_only on public.fcm_tokens
  as restrictive for all to authenticated
  using (public.is_approved() or user_id = auth.uid())
  with check (public.is_approved() or user_id = auth.uid());

create policy approved_members_only on public.push_subscriptions
  as restrictive for all to authenticated
  using (public.is_approved() or user_id = auth.uid())
  with check (public.is_approved() or user_id = auth.uid());

do $$
declare
  t text;
begin
  foreach t in array array[
    'app_settings', 'boards', 'bulletins', 'calendar_events', 'church_info', 'comments',
    'conversation_messages', 'conversation_participants', 'conversations',
    'daily_verse_settings', 'daily_verses', 'district_accounts', 'donation_entries',
    'donation_goals', 'gyodokmun_readings', 'media_items', 'media_reactions', 'member_roles',
    'message_bookmarks', 'message_reactions', 'messages', 'page_views', 'pinned_conversations',
    'popup_notices', 'post_attachments', 'post_likes', 'posts', 'receipt_requests',
    'scheduled_messages'
  ] loop
    execute format(
      'create policy approved_members_only on public.%I as restrictive for all to authenticated
         using (public.is_approved()) with check (public.is_approved())',
      t
    );
  end loop;
end $$;

-- admin_menu_order는 RLS가 꺼져 있어 비로그인 사용자도 읽고 쓸 수 있었음.
alter table public.admin_menu_order enable row level security;
create policy admin_menu_order_select on public.admin_menu_order
  for select to authenticated using (public.is_approved());
create policy admin_menu_order_write on public.admin_menu_order
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 뷰는 소유자 권한으로 실행돼서(RLS 우회) 쓰기 권한이 열려 있으면 비로그인 사용자도
-- 뷰를 통해 profiles/bulletins를 수정·삭제할 수 있었다. 쓰기 권한을 전부 회수.
revoke insert, update, delete, truncate, references, trigger
  on public.member_directory, public.bulletins_public from anon, authenticated;

-- 회원 명단은 승인된 회원만 (그동안 비로그인 상태로도 전체 명단 조회가 가능했음).
create or replace view public.member_directory as
  select id,
         coalesce(display_name, split_part(email, '@', 1)) as display_name,
         district,
         title,
         avatar_path
  from profiles
  where public.is_approved();

-- 스토리지(첨부파일/사진 업로드 등)도 승인 회원만. 공개 버킷의 공개 URL 조회는 RLS를
-- 거치지 않으므로 영향 없음.
create policy approved_members_only on storage.objects
  as restrictive for all to authenticated
  using (public.is_approved()) with check (public.is_approved());
