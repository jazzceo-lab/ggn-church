// 한글 성경 책 이름 -> YouVersion(bible.com)에서 쓰는 표준 3글자 코드(USFM).
// 주보 "성경봉독" 항목의 책 이름을 찾아서 성경 앱 딥링크를 만들 때 씁니다.
const BOOK_CODES = {
  창세기: "GEN", 출애굽기: "EXO", 레위기: "LEV", 민수기: "NUM", 신명기: "DEU",
  여호수아: "JOS", 사사기: "JDG", 룻기: "RUT",
  사무엘상: "1SA", 사무엘하: "2SA", "사무엘기상": "1SA", "사무엘기하": "2SA",
  열왕기상: "1KI", 열왕기하: "2KI",
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

  // 한국 교회에서 흔히 쓰는 약어 (예: "신 8:17", "고전 4:7")
  창: "GEN", 출: "EXO", 레: "LEV", 민: "NUM", 신: "DEU", 수: "JOS", 삿: "JDG", 룻: "RUT",
  삼상: "1SA", 삼하: "2SA", 왕상: "1KI", 왕하: "2KI", 대상: "1CH", 대하: "2CH",
  스: "EZR", 느: "NEH", 에: "EST", 욥: "JOB", 시: "PSA", 잠: "PRO", 전: "ECC", 아: "SNG",
  사: "ISA", 렘: "JER", 애: "LAM", 겔: "EZK", 단: "DAN", 호: "HOS", 욜: "JOL", 암: "AMO",
  옵: "OBA", 욘: "JON", 미: "MIC", 나: "NAM", 합: "HAB", 습: "ZEP", 학: "HAG", 슥: "ZEC",
  말: "MAL",
  마: "MAT", 막: "MRK", 눅: "LUK", 요: "JHN", 행: "ACT", 롬: "ROM",
  고전: "1CO", 고후: "2CO", 갈: "GAL", 엡: "EPH", 빌: "PHP", 골: "COL",
  살전: "1TH", 살후: "2TH", 딤전: "1TI", 딤후: "2TI", 딛: "TIT", 몬: "PHM",
  히: "HEB", 약: "JAS", 벧전: "1PE", 벧후: "2PE",
  요일: "1JN", 요이: "2JN", 요삼: "3JN", 유: "JUD", 계: "REV",
};

// bible.com 성경 버전 번호. RNKSV = 새번역(대한성서공회).
const BIBLE_VERSION_ID = 142;
const BIBLE_VERSION_CODE = "RNKSV";

// 자유 텍스트(청년부 주보 등) 안에서 "신명기 8:11-20", "고린도전서 4:7" 같은 구절을 찾아
// [{ text, href }] 조각으로 나눈다. href가 있는 조각이 성경 링크. 장:절 형태만 인식.
// 앞에 한글이 붙어 있으면 제외 — "오전 10:30"(전=전도서), "금요일 7:30"(요일=요한일서) 오인 방지.
const BOOK_NAMES_PATTERN = Object.keys(BOOK_CODES)
  .sort((a, b) => b.length - a.length)
  .join("|");
const INLINE_REF = new RegExp(
  `(?<![가-힣])(${BOOK_NAMES_PATTERN})\\s*(\\d{1,3}\\s*:\\s*\\d{1,3}(?:\\s*[~\\-]\\s*\\d{1,3})?)`,
  "g"
);

export function splitBibleRefs(text) {
  const src = text ?? "";
  const parts = [];
  let last = 0;
  for (const m of src.matchAll(INLINE_REF)) {
    const href = buildBibleLink(`${m[1]} ${m[2]}`);
    if (!href) continue;
    if (m.index > last) parts.push({ text: src.slice(last, m.index) });
    parts.push({ text: m[0], href });
    last = m.index + m[0].length;
  }
  if (last < src.length) parts.push({ text: src.slice(last) });
  return parts;
}

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
