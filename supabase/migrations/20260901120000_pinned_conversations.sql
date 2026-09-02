-- GGN톡 목록에서 특정 대화방을 상단에 고정하는 기능. 본인만 보는 개인 설정이라
-- 다른 회원에게는 영향이 없고, 기기와 상관없이 동기화되도록 DB에 저장한다.
-- 1:1은 상대방 id, 그룹은 conversation id를 conversation_key로 저장하고
-- conversation_type으로 구분한다(두 테이블에 각각 FK를 걸 수 없어 앱에서 값 검증).

create table if not exists pinned_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  conversation_type text not null check (conversation_type in ('dm', 'group')),
  conversation_key text not null,
  pinned_at timestamptz not null default now(),
  unique (user_id, conversation_type, conversation_key)
);

create index if not exists pinned_conversations_user_idx on pinned_conversations (user_id);

alter table pinned_conversations enable row level security;

drop policy if exists "pinned_conversations_select_own" on pinned_conversations;
create policy "pinned_conversations_select_own"
on pinned_conversations for select
using (user_id = auth.uid());

drop policy if exists "pinned_conversations_insert_own" on pinned_conversations;
create policy "pinned_conversations_insert_own"
on pinned_conversations for insert
with check (user_id = auth.uid());

drop policy if exists "pinned_conversations_delete_own" on pinned_conversations;
create policy "pinned_conversations_delete_own"
on pinned_conversations for delete
using (user_id = auth.uid());
