"use client";

import { useEffect, useRef, useState } from "react";

const MIN = 1;
const MAX = 2.5;
const STEP = 0.25;
const STORAGE_KEY = "textZoomScale";

function clamp(s) {
  return Math.min(MAX, Math.max(MIN, Math.round(s * 100) / 100));
}

function touchDistance([a, b]) {
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

// 교독문·사도신경처럼 "텍스트"로 된 화면용 확대. 찬송가 악보(이미지)는 transform으로
// 확대하지만, 텍스트는 CSS zoom으로 글자 자체를 키워야 화면 폭에 맞춰 줄바꿈이 다시 돼서
// 좌우로 밀지 않고 위아래 스크롤만으로 읽을 수 있다. 두 손가락 핀치 + 하단 −/＋ 버튼.
// 배율은 기기에 기억해둬서(어르신들이 매번 다시 키우지 않게) 다음에 열 때도 유지.
export default function TextZoom({ children, className = "" }) {
  const [scale, setScale] = useState(MIN);
  const pinchRef = useRef(null);

  useEffect(() => {
    try {
      const saved = parseFloat(localStorage.getItem(STORAGE_KEY));
      if (saved) setScale(clamp(saved));
    } catch {}
  }, []);

  function update(next) {
    const s = clamp(next);
    setScale(s);
    try {
      localStorage.setItem(STORAGE_KEY, String(s));
    } catch {}
  }

  function handleTouchStart(e) {
    if (e.touches.length === 2) pinchRef.current = { dist: touchDistance(e.touches), scale };
  }

  function handleTouchMove(e) {
    if (e.touches.length === 2 && pinchRef.current) {
      update(pinchRef.current.scale * (touchDistance(e.touches) / pinchRef.current.dist));
    }
  }

  function handleTouchEnd(e) {
    if (e.touches.length < 2) pinchRef.current = null;
  }

  return (
    <>
      <div
        className={`relative flex-1 overflow-auto ${className}`}
        style={{ touchAction: "pan-x pan-y" }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div style={{ zoom: scale }}>{children}</div>
      </div>
      <div className="relative flex items-center justify-center gap-3 border-t border-black/5 bg-background py-3 dark:border-white/10">
        <button
          onClick={() => update(scale - STEP)}
          disabled={scale <= MIN}
          aria-label="글자 작게"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-black/10 text-foreground/70 transition-colors hover:bg-black/5 disabled:opacity-30 dark:border-white/10 dark:hover:bg-white/10"
        >
          −
        </button>
        <span className="w-12 text-center text-xs text-foreground/50">{Math.round(scale * 100)}%</span>
        <button
          onClick={() => update(scale + STEP)}
          disabled={scale >= MAX}
          aria-label="글자 크게"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-black/10 text-foreground/70 transition-colors hover:bg-black/5 disabled:opacity-30 dark:border-white/10 dark:hover:bg-white/10"
        >
          ＋
        </button>
      </div>
    </>
  );
}
