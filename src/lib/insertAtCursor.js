// input/textarea의 현재 커서 위치에 텍스트를 끼워넣는다. el이 없으면(참조 실패 등)
// 그냥 맨 뒤에 붙인다.
export function insertAtCursor(el, value, setValue, text) {
  if (!el) {
    setValue(value + text);
    return;
  }
  const start = el.selectionStart ?? value.length;
  const end = el.selectionEnd ?? value.length;
  const next = value.slice(0, start) + text + value.slice(end);
  setValue(next);
  requestAnimationFrame(() => {
    el.focus();
    const pos = start + text.length;
    el.setSelectionRange(pos, pos);
  });
}
