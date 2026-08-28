// 한글 성경 책 이름 -> YouVersion(bible.com)에서 쓰는 표준 3글자 코드(USFM).
// 주보 "성경봉독" 항목의 책 이름을 찾아서 성경 앱 딥링크를 만들 때 씁니다.
const BOOK_CODES = {
  창세기: "GEN", 출애굽기: "EXO", 레위기: "LEV", 민수기: "NUM", 신명기: "DEU",
  여호수아: "JOS", 사사기: "JDG", 룻기: "RUT",
  사무엘상: "1SA", 사무엘하: "2SA", 열왕기상: "1KI", 열왕기하: "2KI",
  역대상: "1CH", 역대하: "2CH", 에스라: "EZR", 느헤미야: "NEH", 에스더: "EST",
  욥기: "JOB", 시편: "PSA", 잠언: "PRO", 전도서: "ECC", 아가: "SNG",
  이사야: "ISA", 예레미야: "JER", 예레미야애가: "LAM", 애가: "LAM",
  에스겔: "EZK", 다니엘: "DAN", 호세아: "HOS", 요엘: "JOL", 아모스: "AMO",
  오바댜: "OBA", 요나: "JON", 미가: "MIC", 나훔: "NAM", 하박국: "HAB",
  스바냐: "ZEP", 학개: "HAG", 스가랴: "ZEC", 말라기: "MAL",

  마태복음: "MAT", 마가복음: "MRK", 누가복음: "LUK", 요한복음: "JHN",
  사도행전: "ACT", 로마서: "ROM",
  고린도전서: "1CO", 고린도후서: "2CO", 갈라디아서: "GAL", 에베소서: "EPH",
  빌립보서: "PHP", 골로새서: "COL",
  데살로니가전서: "1TH", 데살로니가후서: "2TH",
  디모데전서: "1TI", 디모데후서: "2TI", 디도서: "TIT", 빌레몬서: "PHM",
  히브리서: "HEB", 야고보서: "JAS",
  베드로전서: "1PE", 베드로후서: "2PE",
  요한일서: "1JN", 요한이서: "2JN", 요한삼서: "3JN",
  "요한1서": "1JN", "요한2서": "2JN", "요한3서": "3JN",
  유다서: "JUD", 요한계시록: "REV", 계시록: "REV",
};

// bible.com 성경 버전 번호. RNKSV = 새번역(대한성서공회).
const BIBLE_VERSION_ID = 142;
const BIBLE_VERSION_CODE = "RNKSV";

// "이사야 51:1~3", "시편 23편", "요한복음 3:16" 같은 문자열을 파싱해서
// bible.com 딥링크 URL을 만듭니다. 못 알아보면 null을 반환합니다.
export function buildBibleLink(text) {
  if (!text) return null;
  const match = text.match(/^([가-힣0-9]+)\s+(\d{1,3})\s*[장편]?(?:\s*[:편]\s*(\d{1,3})(?:\s*[~\-]\s*(\d{1,3}))?)?/);
  if (!match) return null;

  const [, bookName, chapter, verseStart, verseEnd] = match;
  const bookCode = BOOK_CODES[bookName];
  if (!bookCode) return null;

  let ref = `${bookCode}.${chapter}`;
  if (verseStart) {
    ref += `.${verseStart}`;
    if (verseEnd) ref += `-${verseEnd}`;
  }

  return `https://www.bible.com/ko/bible/${BIBLE_VERSION_ID}/${ref}.${BIBLE_VERSION_CODE}`;
}
