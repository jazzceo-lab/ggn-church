-- 관리자 방문통계에 채팅 메시지 개수를 보여주기 위한 함수.
-- messages/conversation_messages는 발신자·수신자만 조회 가능한 개인 대화라 RLS로
-- 관리자에게 열어줄 수 없으므로, 내용은 노출하지 않고 개수만 집계해서 돌려주는
-- security definer 함수로 우회한다.
create or replace function admin_chat_message_count(period_start timestamptz)
returns bigint
language plpgsql
security definer
set search_path = 'public'
as $function$
declare
  total bigint;
begin
  if not exists (select 1 from profiles where id = auth.uid() and is_admin = true) then
    raise exception 'admin only';
  end if;

  select
    (select count(*) from messages where period_start is null or created_at >= period_start)
    + (select count(*) from conversation_messages where period_start is null or created_at >= period_start)
  into total;

  return total;
end;
$function$;
