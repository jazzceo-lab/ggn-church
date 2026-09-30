-- 함수 안에서 이미 관리자만 통과시키지만(admin only 예외), 비로그인 호출 경로 자체도 닫는다.
revoke execute on function public.admin_chat_message_count(timestamptz) from public, anon;
grant execute on function public.admin_chat_message_count(timestamptz) to authenticated;
