-- 그룹 채팅방 이름 바꾸기: 참여자 누구나 방 이름을 바꿀 수 있다.
-- RLS 정책(conversations_update_pin)은 이미 참여자에게 conversations 행 업데이트를
-- 허용해두었으니, name 컬럼에 대한 권한만 추가로 열어주면 된다.
grant update (name) on conversations to authenticated;
