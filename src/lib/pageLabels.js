// 경로를 사람이 읽는 페이지 이름으로 바꾼다. 관리자 접속 현황 표시와
// 방문 통계 화면에서 같이 쓴다.
export function pathLabel(path) {
  if (!path) return null;
  if (path === "/") return "홈";
  if (path.startsWith("/board")) return "공지/게시판";
  if (path.startsWith("/messages")) return "GGN톡";
  if (path.startsWith("/bulletin")) return "주보";
  if (path.startsWith("/calendar")) return "교회일정";
  if (path.startsWith("/scripture")) return "성경";
  if (path.startsWith("/donate")) return "헌금안내";
  if (path.startsWith("/teams")) return "제직명단";
  if (path.startsWith("/media")) return "설교·찬양";
  if (path.startsWith("/hymns")) return "찬송가";
  if (path.startsWith("/account")) return "회원정보";
  if (path.startsWith("/admin")) return "관리자 화면";
  if (path.startsWith("/login") || path.startsWith("/signup")) return "로그인/가입";
  return path;
}

// 게시판 카테고리 key -> 라벨. board/page.js의 CATEGORIES와 일치해야 함.
export const BOARD_CATEGORY_LABELS = {
  district: "구역게시판",
  prayer: "기도게시판",
  share: "나눔게시판",
  suggestion: "교회건의",
  help: "앱사용문의",
  resources: "자료실",
};
