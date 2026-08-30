"use client";

import { useEffect, useRef } from "react";

const BOTTOM_THRESHOLD = 24;
// 맨 아래에서 이만큼(px) 위로 끌어올리면 그라데이션이 최대로 진해진다.
const MAX_PULL = 80;

// 페이지 맨 아래(더 이상 볼 내용이 없는 지점)에 도달한 뒤, 손가락으로
// 위로 계속 끄는(오버스크롤) 동안에만 그 거리만큼 그라데이션이 나타난다.
// 손을 떼면 다시 사라진다.
export default function ScrollFadeBottom() {
  const ref = useRef(null);
  const touchStartY = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function isAtBottom() {
      return window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - BOTTOM_THRESHOLD;
    }

    function handleTouchStart(e) {
      if (!isAtBottom()) return;
      touchStartY.current = e.touches[0].clientY;
      el.style.transition = "none";
    }

    function handleTouchMove(e) {
      if (touchStartY.current === null) return;
      const pulled = touchStartY.current - e.touches[0].clientY;
      const ratio = Math.max(0, Math.min(pulled / MAX_PULL, 1));
      el.style.opacity = String(ratio);
    }

    function handleTouchEnd() {
      if (touchStartY.current === null) return;
      touchStartY.current = null;
      el.style.transition = "";
      el.style.opacity = "0";
    }

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd);
    window.addEventListener("touchcancel", handleTouchEnd);

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, []);

  return <div ref={ref} className="scroll-fade-bottom" aria-hidden="true" />;
}
