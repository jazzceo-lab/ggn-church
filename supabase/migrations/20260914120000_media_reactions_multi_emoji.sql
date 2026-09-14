-- media_reactions를 post_likes와 같은 다중 이모지 반응 구조로 확장.
-- 감사해요(🙏) 하나뿐이라 너무 단순하다는 피드백으로, board 게시판과 동일한
-- REACTIONS 세트(❤️🙏😊👍😢)를 그대로 쓴다. 사용자당 미디어 1개 반응만 유지.
alter table media_reactions add column if not exists reaction_type text not null default 'like';
