// 주보 관리자 화면에서 배열/짝(pair) 데이터를 여러 줄 텍스트로 주고받기 위한 변환 함수.
// "항목/내용" 형식은 예배순서·섬김이처럼 두 값이 짝을 이루는 데이터에 쓴다.

export function linesToArray(text) {
  return String(text ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function arrayToLines(arr) {
  return (arr ?? []).join("\n");
}

export function pairsToArray(text) {
  return String(text ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const i = line.indexOf("/");
      if (i === -1) return [line, ""];
      return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
    });
}

export function arrayToPairs(pairs) {
  return (pairs ?? []).map(([label, detail]) => `${label}/${detail ?? ""}`).join("\n");
}
