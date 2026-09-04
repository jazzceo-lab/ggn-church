// 오늘의 말씀 목록은 daily_verses 테이블(관리자가 /admin/content 에서 편집)에서 가져온다.
// 혹시 테이블이 비어 있어도 페이지가 비지 않도록 최소 하나의 성구를 기본값으로 둔다.
export const FALLBACK_VERSE = {
  ref: "요한복음 3:16",
  text: "하나님이 세상을 이처럼 사랑하사 독생자를 주셨으니 이는 그를 믿는 자마다 멸망하지 않고 영생을 얻게 하려 하심이라",
};

function dayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function pickVerseForDay(verses, date = new Date()) {
  if (!verses || verses.length === 0) return FALLBACK_VERSE;
  return verses[dayOfYear(date) % verses.length];
}
