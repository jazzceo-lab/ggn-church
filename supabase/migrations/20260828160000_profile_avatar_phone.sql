-- 회원이 회원정보 화면에서 자기 프로필 사진과 핸드폰 번호를 직접 등록/수정할 수 있게 한다.
--
-- board_last_seen_at(20260827130000_board_last_seen_sync.sql)과 동일한 패턴: 민감한
-- 컬럼(is_admin, district 등)은 손댈 수 없도록 phone/avatar_path 두 컬럼만 컬럼 단위
-- GRANT로 authenticated 역할에 UPDATE 권한을 주고, RLS로 "본인 행만" 수정 가능하게 제한한다.

alter table profiles add column if not exists phone text;
alter table profiles add column if not exists avatar_path text;

alter table profiles enable row level security;

grant update (phone, avatar_path) on profiles to authenticated;

drop policy if exists "profiles_update_own_avatar_phone" on profiles;
create policy "profiles_update_own_avatar_phone"
on profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);
