export function formIsOpen(f) {
  return f.is_open && (!f.closes_at || new Date(f.closes_at) > new Date());
}

// 선택형 질문의 선택지별 응답 수. { [questionId]: { [option]: count } }
export function countChoices(questions, responses) {
  const out = {};
  for (const q of questions) {
    if (q.type === "text") continue;
    out[q.id] = Object.fromEntries((q.options ?? []).map((o) => [o, 0]));
    for (const r of responses) {
      const a = r.answers?.[q.id];
      for (const v of Array.isArray(a) ? a : a ? [a] : []) if (v in out[q.id]) out[q.id][v]++;
    }
  }
  return out;
}
