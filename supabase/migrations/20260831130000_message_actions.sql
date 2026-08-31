-- 채팅(1:1 messages / 그룹 conversation_messages)에 이모지 반응, 답장, 공지 고정,
-- 책갈피 기능을 추가한다. messages.id는 bigint, conversation_messages.id는 uuid로
-- 타입이 서로 달라 reactions/bookmarks의 message_id는 text로 두고, message_type
-- ('dm'|'group')으로 어느 테이블/타입인지 구분한다(두 테이블에 각각 FK를 걸 수
-- 없으므로 can_access_message()에서 캐스팅해 검증).

alter table messages add column if not exists reply_to_id bigint references messages(id) on delete set null;
alter table conversation_messages add column if not exists reply_to_id uuid references conversation_messages(id) on delete set null;
alter table conversations add column if not exists pinned_message_id uuid references conversation_messages(id) on delete set null;

create table if not exists message_reactions (
  id uuid primary key default gen_random_uuid(),
  message_type text not null check (message_type in ('dm', 'group')),
  message_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  reaction_type text not null,
  created_at timestamptz not null default now(),
  unique (message_type, message_id, user_id)
);

create index if not exists message_reactions_lookup_idx
  on message_reactions (message_type, message_id);

create table if not exists message_bookmarks (
  id uuid primary key default gen_random_uuid(),
  message_type text not null check (message_type in ('dm', 'group')),
  message_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (message_type, message_id, user_id)
);

create index if not exists message_bookmarks_user_idx
  on message_bookmarks (user_id);

alter table message_reactions enable row level security;
alter table message_bookmarks enable row level security;

-- dm 메시지는 발신/수신자만, 그룹 메시지는 해당 방 참여자만 반응/책갈피 대상이 될 수 있다.
-- message_id는 text로 저장되므로 타입별로 실제 id 타입(bigint/uuid)에 캐스팅해서 비교한다.
create or replace function can_access_message(check_message_type text, check_message_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case check_message_type
    when 'dm' then exists (
      select 1 from messages m
      where m.id = check_message_id::bigint
        and (m.sender_id = auth.uid() or m.recipient_id = auth.uid())
    )
    when 'group' then exists (
      select 1 from conversation_messages cm
      where cm.id = check_message_id::uuid
        and is_conversation_participant(cm.conversation_id)
    )
    else false
  end;
$$;

drop policy if exists "message_reactions_select" on message_reactions;
create policy "message_reactions_select"
on message_reactions for select
using (can_access_message(message_type, message_id));

drop policy if exists "message_reactions_insert_own" on message_reactions;
create policy "message_reactions_insert_own"
on message_reactions for insert
with check (user_id = auth.uid() and can_access_message(message_type, message_id));

drop policy if exists "message_reactions_delete_own" on message_reactions;
create policy "message_reactions_delete_own"
on message_reactions for delete
using (user_id = auth.uid());

drop policy if exists "message_bookmarks_select_own" on message_bookmarks;
create policy "message_bookmarks_select_own"
on message_bookmarks for select
using (user_id = auth.uid());

drop policy if exists "message_bookmarks_insert_own" on message_bookmarks;
create policy "message_bookmarks_insert_own"
on message_bookmarks for insert
with check (user_id = auth.uid() and can_access_message(message_type, message_id));

drop policy if exists "message_bookmarks_delete_own" on message_bookmarks;
create policy "message_bookmarks_delete_own"
on message_bookmarks for delete
using (user_id = auth.uid());

-- 공지(고정) 메시지 지정: 그룹 참여자 누구나 고정/해제할 수 있다.
grant update (pinned_message_id) on conversations to authenticated;

drop policy if exists "conversations_update_pin" on conversations;
create policy "conversations_update_pin"
on conversations for update
using (is_conversation_participant(id))
with check (is_conversation_participant(id));
