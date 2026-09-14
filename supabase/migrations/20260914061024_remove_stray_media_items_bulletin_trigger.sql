-- media_items 테이블에 실수로 붙어있던 트리거 제거.
-- notify_new_bulletin()은 table:'bulletins'를 하드코딩해 push를 보내는 함수인데,
-- 대시보드에서 실수로 media_items에도 걸어놔서 영상/사진 등록 때마다
-- "새 주보가 올라왔어요" 알림이 잘못 나가고 있었다.
drop trigger if exists "notify-new-bulletin" on media_items;
