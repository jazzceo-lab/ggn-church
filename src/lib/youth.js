// 청년부 전용 메뉴 권한. DB의 can_manage_youth()/can_view_youth()와 같은 기준이어야 한다
// (supabase/migrations/20260930100000_youth_bulletins.sql).
export const YOUTH = "청년부";

// 관리자 + 목회자 + 청년부 임원진
export function canManageYouth({ isAdmin, district, hasRoleScope }) {
  return !!isAdmin || district === "목회자" || hasRoleScope("youth_officer", "");
}

// 청년부 회원 + 게시판 관리자 + 청년부 관리자
export function canViewYouth(auth) {
  return auth.district === YOUTH || !!auth.isBoardAdmin || canManageYouth(auth);
}

// 첫 줄 "(2026.09.27)청년부 주일"에서 날짜를 YYYY-MM-DD로 뽑는다. 못 찾으면 null.
export function parseYouthBulletinDate(text) {
  const m = (text ?? "").match(/\(\s*(\d{4})\s*[.\-/]\s*(\d{1,2})\s*[.\-/]\s*(\d{1,2})\s*\)/);
  return m ? `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}` : null;
}
