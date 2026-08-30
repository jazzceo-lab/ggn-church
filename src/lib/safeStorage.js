// 시크릿(프라이빗) 브라우징나 저장공간 제한 등에서는 localStorage 접근 자체가
// 예외를 던질 수 있다. 이 컴포넌트들은 앱 최상단(레이아웃)에 항상 떠 있어서,
// 그 예외를 못 잡으면 화면 전체가 하얗게 깨질 수 있어 안전하게 감싼다.
export function safeGetItem(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSetItem(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // 저장에 실패해도 기능 자체는 계속 동작해야 하므로 조용히 무시한다.
  }
}
