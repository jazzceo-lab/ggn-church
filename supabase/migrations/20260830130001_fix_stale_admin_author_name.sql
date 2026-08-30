-- 게시판 글/댓글의 작성자 이름은 작성 시점의 스냅샷이라, profiles.display_name을
-- "테스트관리자"에서 "관리자"로 바꿔도 이미 쓴 글/댓글에는 반영되지 않았다.
-- 기존 표기를 맞춰준다.

update posts set author_name = '관리자' where author_name = '테스트관리자';
update comments set author_name = '관리자' where author_name = '테스트관리자';
