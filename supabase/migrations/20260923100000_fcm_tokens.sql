-- Capacitor 앱(FCM 푸시) 등록 토큰 저장용. 기존 push_subscriptions(웹 Push/VAPID,
-- 브라우저 사용자용)는 그대로 두고 별도 채널로 병행한다.
create table if not exists public.fcm_tokens (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  token text not null,
  platform text not null default 'android',
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique (user_id, token)
);

alter table public.fcm_tokens enable row level security;

create policy "본인 fcm 토큰만 관리 가능"
  on public.fcm_tokens for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "fcm_tokens_admin_select"
  on public.fcm_tokens for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));
