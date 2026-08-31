const STORAGE_KEY = "hiddenMessages";

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function loadHiddenMessageIds(messageType) {
  const prefix = `${messageType}:`;
  return new Set(readAll().filter((k) => k.startsWith(prefix)).map((k) => k.slice(prefix.length)));
}

export function hideMessageLocally(messageType, messageId) {
  try {
    const key = `${messageType}:${messageId}`;
    const all = readAll();
    if (!all.includes(key)) localStorage.setItem(STORAGE_KEY, JSON.stringify([...all, key]));
  } catch {
    // localStorage 접근 불가(프라이빗 모드 등) 시 조용히 무시 - 로컬 숨김은 편의 기능일 뿐이다.
  }
}
