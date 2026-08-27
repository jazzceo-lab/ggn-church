-- 게시판 "마지막으로 본 시점"을 기기별 localStorage 대신 DB에 저장해서
-- 여러 기기(폰/PC)에서 동기화되도록 합니다.
--
-- board_last_seen_at은 각자 자기 것만 바꿀 수 있어야 하므로, 컬럼 단위 GRANT로
-- authenticated 역할에게 이 컬럼 하나만 UPDATE 권한을 주고, RLS로 "본인 행만"
-- 수정 가능하게 제한합니다. 다른 민감한 컬럼(is_admin, district 등)은 이 GRANT에
-- 포함되지 않아서 이 경로로는 손댈 수 없습니다.

alter table profiles add column if not exists board_last_seen_at timestamptz;

alter table profiles enable row level security;

grant update (board_last_seen_at) on profiles to authenticated;

drop policy if exists "profiles_update_own_board_seen" on profiles;
create policy "profiles_update_own_board_seen"
on profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);
