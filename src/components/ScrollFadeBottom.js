"use client";

import { useEffect, useRef } from "react";

const BOTTOM_THRESHOLD = 24;
// 맨 아래에서 이만큼(px) 위로 끌어올리면 그라데이션이 최대로 진해진다.
const MAX_PULL = 80;

// 화면 아래에 콘텐츠가 더 있을 때는 항상 그라데이션을 보여주고,
// 맨 아래까지 스크롤한 뒤에는 손가락으로 위로 끄는 만큼(오버스크롤)만
// 진하게 나타나게 한다. 손을 떼면 다시 사라진다.
export default function ScrollFadeBottom() {
  const ref = useRef(null);
  const touchStartY = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function isAtBottom() {
      return window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - BOTTOM_THRESHOLD;
    }
    function isScrollable() {
      return document.documentElement.scrollHeight > window.innerHeight;
    }

    function update() {
      if (touchStartY.current !== null) return;
      el.style.opacity = isScrollable() && !isAtBottom() ? "1" : "0";
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
      update();
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd);
    window.addEventListener("touchcancel", handleTouchEnd);

    const observer = new ResizeObserver(update);
    observer.observe(document.body);

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchEnd);
      observer.disconnect();
    };
  }, []);

  return <div ref={ref} className="scroll-fade-bottom" aria-hidden="true" />;
}
