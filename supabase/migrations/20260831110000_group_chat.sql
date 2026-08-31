-- 그룹 채팅(단체 쪽지) 기능. 기존 1:1 쪽지(messages)는 그대로 두고 별도 테이블 3개를 추가한다.
-- conversations: 그룹 채팅방 1개당 한 행. name은 선택(비어있으면 UI에서 참여자 이름으로 표시).
-- conversation_participants: 방 참여자 명단. last_read_at으로 안읽음 배지를 계산한다.
-- conversation_messages: 그룹 채팅 메시지 본문.

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  name text,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists conversation_participants (
  conversation_id uuid not null references conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  primary key (conversation_id, user_id)
);

create table if not exists conversation_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text,
  attachment_url text,
  attachment_name text,
  created_at timestamptz not null default now()
);

create index if not exists conversation_messages_conversation_id_created_at_idx
  on conversation_messages (conversation_id, created_at);

create index if not exists conversation_participants_user_id_idx
  on conversation_participants (user_id);

-- member_roles의 has_role()과 같은 패턴: 다른 정책에서 재귀 없이
-- "이 사용자가 이 대화방 참여자인가"를 한 줄로 체크하는 SECURITY DEFINER 헬퍼.
create or replace function is_conversation_participant(check_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from conversation_participants
    where conversation_id = check_conversation_id and user_id = auth.uid()
  );
$$;

alter table conversations enable row level security;
alter table conversation_participants enable row level security;
alter table conversation_messages enable row level security;

-- conversations: 참여자거나 본인이 만든 방. created_by도 허용하는 이유는, 방을 막 만든
-- 직후(참여자 행을 아직 insert하기 전) insert().select()로 되읽어야 하기 때문(닭-달걀 문제 방지).
drop policy if exists "conversations_select_participant" on conversations;
create policy "conversations_select_participant"
on conversations for select
using (
  created_by = auth.uid()
  or is_conversation_participant(id)
);

-- 방 생성은 로그인한 사람 누구나 가능(1:1 쪽지와 동일하게 생성 제한 없음).
drop policy if exists "conversations_insert_own" on conversations;
create policy "conversations_insert_own"
on conversations for insert
with check (created_by = auth.uid());

-- conversation_participants: 참여자 명단은 같은 방 참여자끼리만 조회 가능.
drop policy if exists "conversation_participants_select_participant" on conversation_participants;
create policy "conversation_participants_select_participant"
on conversation_participants for select
using (is_conversation_participant(conversation_id));

-- 참여자 추가는 그 방을 만든 사람만(방 생성 직후 자신+선택한 회원들을 한 번에 insert).
-- 나중에 "멤버 초대" 기능이 생기면 이 정책을 참여자 전체로 넓히면 됨.
drop policy if exists "conversation_participants_insert_creator" on conversation_participants;
create policy "conversation_participants_insert_creator"
on conversation_participants for insert
with check (
  exists (select 1 from conversations c where c.id = conversation_id and c.created_by = auth.uid())
);

-- 읽음 처리(last_read_at)는 messages.read_at과 같은 패턴: 컬럼 단위 권한 + 본인 행만.
grant update (last_read_at) on conversation_participants to authenticated;

drop policy if exists "conversation_participants_mark_read" on conversation_participants;
create policy "conversation_participants_mark_read"
on conversation_participants for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- 참여자 스스로 방 나가기(본인 행 삭제)는 지금 UI는 없지만, 나중에 추가할 때
-- 마이그레이션을 또 만들 필요 없도록 스키마 차원에서 미리 열어둔다.
drop policy if exists "conversation_participants_delete_own" on conversation_participants;
create policy "conversation_participants_delete_own"
on conversation_participants for delete
using (auth.uid() = user_id);

-- conversation_messages: 참여자만 조회/작성 가능.
drop policy if exists "conversation_messages_select_participant" on conversation_messages;
create policy "conversation_messages_select_participant"
on conversation_messages for select
using (is_conversation_participant(conversation_id));

drop policy if exists "conversation_messages_insert_participant" on conversation_messages;
create policy "conversation_messages_insert_participant"
on conversation_messages for insert
with check (sender_id = auth.uid() and is_conversation_participant(conversation_id));

-- 삭제: 본인 메시지만.
drop policy if exists "conversation_messages_delete_own" on conversation_messages;
create policy "conversation_messages_delete_own"
on conversation_messages for delete
using (sender_id = auth.uid());

-- messages_delete_before_read와 같은 취지의 RESTRICTIVE 정책: 나 말고 다른 참여자가
-- 이미 읽은(last_read_at이 이 메시지 작성 시각 이후인) 메시지는 취소할 수 없다.
drop policy if exists "conversation_messages_delete_before_read" on conversation_messages;
create policy "conversation_messages_delete_before_read"
on conversation_messages as restrictive for delete
using (
  not exists (
    select 1 from conversation_participants cp
    where cp.conversation_id = conversation_messages.conversation_id
      and cp.user_id <> conversation_messages.sender_id
      and cp.last_read_at >= conversation_messages.created_at
  )
);

-- Realtime: messages/posts는 supabase_realtime publication이 Studio에서 관리되어 온 것으로
-- 보이며(마이그레이션 이력 없음), 새 테이블은 기본적으로 publication에 포함되지 않는다.
-- 마이그레이션 실행 권한으로 ALTER PUBLICATION이 가능한지 확인 필요 — 실패하면 Supabase
-- 대시보드 > Database > Replication에서 conversation_messages를 supabase_realtime
-- publication에 수동으로 추가할 것.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'conversation_messages'
  ) then
    alter publication supabase_realtime add table public.conversation_messages;
  end if;
end $$;
