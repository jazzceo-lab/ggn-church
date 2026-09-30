-- 회원별 화면 색상(테마). null이면 기본(warm).
-- 본인 행 update는 기존 profiles RLS(본인만 수정)로 충분 — 권한 컬럼이 아니다.
alter table public.profiles add column if not exists theme_preset text
  check (theme_preset in ('warm', 'forest', 'ocean', 'lavender', 'rose', 'slate'));
