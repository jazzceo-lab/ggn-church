// 회원이 회원정보에서 고르는 개인 화면 색. 실제 색상 변수는 src/app/globals.css의
// [data-church-theme] 블록. 여기 값은 선택 화면의 견본 색용. 기본(null)은 warm.
export const THEME_PRESETS = [
  { value: "warm", label: "따뜻한 베이지 (기본)", brand: "#c19c89", tint: "#f3e8e1" },
  { value: "forest", label: "숲 초록", brand: "#5f8f6e", tint: "#e3eee5" },
  { value: "ocean", label: "바다 파랑", brand: "#5b86b0", tint: "#e1ebf5" },
  { value: "lavender", label: "라벤더", brand: "#8a76b5", tint: "#ebe5f5" },
  { value: "rose", label: "로즈", brand: "#c07a8a", tint: "#f5e3e7" },
  { value: "slate", label: "차분한 회색", brand: "#56657a", tint: "#e4e8ed" },
];

export function applyTheme(value) {
  document.documentElement.setAttribute("data-church-theme", value || "warm");
}
