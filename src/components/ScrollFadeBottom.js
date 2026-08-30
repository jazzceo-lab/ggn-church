"use client";

import { useEffect, useRef } from "react";

const BOTTOM_THRESHOLD = 24;

// 화면 아래에 콘텐츠가 더 있을 때만 하단 그라데이션을 보여주고,
// 맨 끝까지 스크롤하면(또는 애초에 스크롤할 내용이 없으면) 사라지게 한다.
export default function ScrollFadeBottom() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function update() {
      const scrollable = document.documentElement.scrollHeight > window.innerHeight;
      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - BOTTOM_THRESHOLD;
      el.style.opacity = scrollable && !atBottom ? "1" : "0";
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    const observer = new ResizeObserver(update);
    observer.observe(document.body);

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      observer.disconnect();
    };
  }, []);

  return <div ref={ref} className="scroll-fade-bottom" aria-hidden="true" />;
}
