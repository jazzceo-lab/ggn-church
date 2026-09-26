-- 그룹채팅(conversation_messages)에는 push 발송 트리거가 아예 없었음(1:1 messages만
-- notify_new_message 트리거가 있었음). send-push 엣지함수엔 conversation_messages
-- 분기가 이미 있으니, 같은 함수를 그대로 재사용해 트리거만 추가한다.
-- (record만 보내면 send-push가 table 없을 때 messages로 간주해버리므로, table을
-- 명시해서 보내도록 새 트리거 함수를 둔다.)

create or replace function notify_new_group_message()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $function$
begin
  perform net.http_post(
    url := 'https://ncskpuolqlkgckqtrcwb.supabase.co/functions/v1/send-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || 'sb_publishable_AdVsZfs6kH0uQ8bAP8tVSQ__ULT4pha'
    ),
    body := jsonb_build_object('table', 'conversation_messages', 'record', row_to_json(new))
  );
  return new;
end;
$function$;

drop trigger if exists on_new_group_message_send_push on conversation_messages;
create trigger on_new_group_message_send_push
after insert on conversation_messages
for each row
execute function notify_new_group_message();
