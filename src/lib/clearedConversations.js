const STORAGE_KEY = "clearedConversations";

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getClearedAt(conversationType, key) {
  return readAll()[`${conversationType}:${key}`] ?? null;
}

export function clearConversationLocally(conversationType, key, timestamp) {
  try {
    const all = readAll();
    all[`${conversationType}:${key}`] = timestamp;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // localStorage 접근 불가(프라이빗 모드 등) 시 조용히 무시 - 로컬 정리는 편의 기능일 뿐이다.
  }
}
