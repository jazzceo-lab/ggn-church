// 목사/장로/권사 직함 뱃지 색상. 장로는 은색(슬레이트 계열), 권사는 회색,
// 그 외(목사 등)는 기존 노란색.
export function titleBadgeClass(title) {
  if (title === "장로") {
    return "bg-slate-200 text-slate-700 dark:bg-slate-500/30 dark:text-slate-200";
  }
  if (title === "권사") {
    return "bg-gray-200 text-gray-700 dark:bg-gray-500/30 dark:text-gray-200";
  }
  return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300";
}
