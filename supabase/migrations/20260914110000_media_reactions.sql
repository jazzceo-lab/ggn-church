-- 영상/음성 콘텐츠에 회원이 "감사해요" 이모지로 반응할 수 있게 하는 테이블.
-- post_likes와 같은 구조(사용자당 미디어 1개 항목)를 그대로 따른다.
create table if not exists media_reactions (
  media_id bigint not null references media_items(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (media_id, user_id)
);

alter table media_reactions enable row level security;

drop policy if exists "로그인한 교인만 반응 조회 가능" on media_reactions;
create policy "로그인한 교인만 반응 조회 가능"
on media_reactions for select
using (auth.uid() is not null);

drop policy if exists "본인 반응만 추가 가능" on media_reactions;
create policy "본인 반응만 추가 가능"
on media_reactions for insert
with check (auth.uid() = user_id);

drop policy if exists "본인 반응만 취소 가능" on media_reactions;
create policy "본인 반응만 취소 가능"
on media_reactions for delete
using (auth.uid() = user_id);
