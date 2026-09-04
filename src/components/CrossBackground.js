// 사도신경·교독문처럼 신앙고백을 낭독하는 전체화면 페이지에 쓰는 아주 옅은 십자가
// 워터마크. 글씨 가독성을 해치지 않도록 낮은 투명도로만 넣는다.
export default function CrossBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-[-8%] bg-[radial-gradient(ellipse_70%_60%_at_50%_42%,transparent_55%,rgba(0,0,0,0.08)_100%)]" />
      <svg
        viewBox="0 0 100 140"
        fill="none"
        className="absolute left-1/2 top-1/2 w-[46%] max-w-xs -translate-x-1/2 -translate-y-[46%] text-brand-dark/15"
      >
        <path d="M50 4 V136 M18 42 H82" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
      </svg>
    </div>
  );
}
