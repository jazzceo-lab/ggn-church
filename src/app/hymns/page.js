"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { HYMN_TITLES } from "@/lib/hymnTitles";

const TOTAL_HYMNS = 645;
const CHUNK_SIZE = 100;

function buildRanges() {
  const ranges = [];
  for (let start = 1; start <= TOTAL_HYMNS; start += CHUNK_SIZE) {
    const end = Math.min(start + CHUNK_SIZE - 1, TOTAL_HYMNS);
    ranges.push({ start, end, label: `${start} ~ ${end}장` });
  }
  return ranges;
}

const RANGES = buildRanges();

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const ZOOM_STEP = 0.5;
const DOUBLE_TAP_SCALE = 2.5;
const DOUBLE_TAP_MS = 300;
const TAP_MOVE_THRESHOLD = 10;

function pad(n) {
  return String(n).padStart(3, "0");
}

function clampScale(s) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));
}

function touchDistance(touches) {
  const [a, b] = touches;
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

export default function HymnsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [openRange, setOpenRange] = useState(null);
  const [fullscreenHymn, setFullscreenHymn] = useState(null);
  const [cameFromBulletin, setCameFromBulletin] = useState(false);
  const [imageUrls, setImageUrls] = useState({});
  const [loadingHymn, setLoadingHymn] = useState(null);
  const [hymnError, setHymnError] = useState({});
  const [rotated, setRotated] = useState(false);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const pinchRef = useRef(null);
  const panRef = useRef(null);
  const lastTapRef = useRef(0);
  const viewerRef = useRef(null);

  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams(window.location.search);
    const num = parseInt(params.get("open"), 10);
    if (!num || num < 1 || num > TOTAL_HYMNS) return;
    const rangeIdx = RANGES.findIndex((r) => num >= r.start && num <= r.end);
    if (rangeIdx !== -1) setOpenRange(rangeIdx);
    openHymn(num, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  function toggleRange(idx) {
    setOpenRange((prev) => (prev === idx ? null : idx));
  }

  function resetZoom() {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }

  function toggleRotated() {
    setRotated((v) => !v);
    resetZoom();
  }

  function zoomIn() {
    setScale((s) => clampScale(s + ZOOM_STEP));
  }

  function zoomOut() {
    setScale((s) => {
      const next = clampScale(s - ZOOM_STEP);
      if (next === MIN_SCALE) setTranslate({ x: 0, y: 0 });
      return next;
    });
  }

  function toggleDoubleTapZoom() {
    if (scale > MIN_SCALE) {
      resetZoom();
    } else {
      setScale(DOUBLE_TAP_SCALE);
    }
  }

  function handleTouchStart(e) {
    if (e.touches.length === 2) {
      pinchRef.current = { startDist: touchDistance(e.touches), startScale: scale };
      panRef.current = null;
    } else if (e.touches.length === 1) {
      const t = e.touches[0];
      panRef.current = { startX: t.clientX, startY: t.clientY, startTranslate: translate, moved: false };
      pinchRef.current = null;
    }
  }

  function handleTouchMove(e) {
    if (e.touches.length === 2 && pinchRef.current) {
      e.preventDefault();
      const dist = touchDistance(e.touches);
      const next = clampScale(pinchRef.current.startScale * (dist / pinchRef.current.startDist));
      setScale(next);
      if (next === MIN_SCALE) setTranslate({ x: 0, y: 0 });
    } else if (e.touches.length === 1 && panRef.current && scale > MIN_SCALE) {
      e.preventDefault();
      const t = e.touches[0];
      const dxScreen = t.clientX - panRef.current.startX;
      const dyScreen = t.clientY - panRef.current.startY;
      if (Math.abs(dxScreen) > TAP_MOVE_THRESHOLD || Math.abs(dyScreen) > TAP_MOVE_THRESHOLD) {
        panRef.current.moved = true;
      }
      // 회전된 상태에서는 화면 좌우/상하 이동이 실제 이미지 좌표계에서는 축이 바뀐다.
      const [ddx, ddy] = rotated ? [dyScreen, -dxScreen] : [dxScreen, dyScreen];
      setTranslate({
        x: panRef.current.startTranslate.x + ddx,
        y: panRef.current.startTranslate.y + ddy,
      });
    }
  }

  function handleTouchEnd(e) {
    if (e.touches.length === 0) {
      if (panRef.current && !panRef.current.moved && !pinchRef.current) {
        const now = Date.now();
        if (now - lastTapRef.current < DOUBLE_TAP_MS) {
          toggleDoubleTapZoom();
          lastTapRef.current = 0;
        } else {
          lastTapRef.current = now;
        }
      }
      pinchRef.current = null;
      panRef.current = null;
    } else if (e.touches.length === 1) {
      const t = e.touches[0];
      panRef.current = { startX: t.clientX, startY: t.clientY, startTranslate: translate, moved: true };
      pinchRef.current = null;
    }
  }

  async function openHymn(num, fromBulletin = false) {
    setFullscreenHymn(num);
    setCameFromBulletin(fromBulletin);
    resetZoom();
    setHymnError((prev) => ({ ...prev, [num]: false }));
    if (imageUrls[num]) return;

    setLoadingHymn(num);
    const { data, error } = await supabase.storage
      .from("hymns")
      .createSignedUrl(`${pad(num)}.jpg`, 60 * 60);
    setLoadingHymn(null);

    if (error || !data?.signedUrl) {
      setHymnError((prev) => ({ ...prev, [num]: true }));
      return;
    }
    setImageUrls((prev) => ({ ...prev, [num]: data.signedUrl }));
  }

  function closeHymn() {
    if (document.fullscreenElement) document.exitFullscreen();
    if (cameFromBulletin) {
      router.push("/bulletin");
      return;
    }
    setFullscreenHymn(null);
    setRotated(false);
    resetZoom();
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      viewerRef.current?.requestFullscreen?.();
    }
  }

  if (!authLoading && !user) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 text-center">
        <h1 className="font-serif text-2xl font-bold text-foreground">찬송가</h1>
        <p className="mt-3 text-sm text-foreground/60">악보는 로그인한 교인만 볼 수 있어요.</p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-full bg-brand px-4 py-2 text-sm text-white transition-colors hover:bg-brand-dark"
        >
          로그인하러 가기
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-3 pb-12">
      <h1 className="font-serif text-2xl font-bold text-foreground">찬송가</h1>
      <p className="mt-2 text-sm text-foreground/50">장 범위를 눌러 목록을 펼쳐보세요.</p>

      <div className="mt-4 space-y-2">
        {RANGES.map((range, idx) => (
          <div
            key={range.label}
            className="rounded-xl border border-black/10 bg-white/60 dark:border-white/10 dark:bg-white/5"
          >
            <button
              onClick={() => toggleRange(idx)}
              className="flex w-full items-center justify-between px-4 py-3 text-left font-medium text-foreground"
            >
              {range.label}
              <span className="text-foreground/40">{openRange === idx ? "▲" : "▼"}</span>
            </button>

            {openRange === idx && (
              <ul className="divide-y divide-black/5 border-t border-black/10 dark:divide-white/10 dark:border-white/10">
                {Array.from({ length: range.end - range.start + 1 }, (_, i) => range.start + i).map(
                  (num) => (
                    <li key={num}>
                      <button
                        onClick={() => openHymn(num)}
                        className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm text-foreground/80 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                      >
                        {num}장{HYMN_TITLES[num] ? ` - ${HYMN_TITLES[num]}` : ""}
                      </button>
                    </li>
                  )
                )}
              </ul>
            )}
          </div>
        ))}
      </div>

      {fullscreenHymn && (
        <div ref={viewerRef} className="fixed inset-0 z-50 flex flex-col bg-background">
          <div className="border-b border-black/5 bg-background px-4 py-3 dark:border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Image
                  src="/images/logo-mark.jpg"
                  alt="길가는교회 로고"
                  width={32}
                  height={32}
                  className="rounded-full ring-1 ring-black/5"
                />
                <span className="font-serif text-lg font-bold tracking-tight text-foreground">
                  길가는교회
                </span>
              </div>
              <button
                onClick={closeHymn}
                className="whitespace-nowrap rounded-full border border-black/10 px-3 py-1 text-sm text-foreground/80 transition-colors hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
              >
                ← 되돌아가기
              </button>
            </div>
            <p className="mt-2 text-sm font-medium text-foreground">
              {fullscreenHymn}장{HYMN_TITLES[fullscreenHymn] ? ` - ${HYMN_TITLES[fullscreenHymn]}` : ""}
            </p>
          </div>

          <div className="flex flex-1 items-center justify-center overflow-hidden p-2">
            {loadingHymn === fullscreenHymn && (
              <p className="text-sm text-foreground/50">불러오는 중...</p>
            )}
            {hymnError[fullscreenHymn] && (
              <p className="text-sm text-red-600">
                아직 등록되지 않은 악보이거나 불러오지 못했어요.
              </p>
            )}
            {imageUrls[fullscreenHymn] && (
              <img
                src={imageUrls[fullscreenHymn]}
                alt={`${fullscreenHymn}장 악보`}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onDoubleClick={toggleDoubleTapZoom}
                draggable={false}
                className={pinchRef.current || panRef.current ? "select-none" : "select-none transition-transform duration-150"}
                style={{
                  touchAction: "none",
                  cursor: scale > MIN_SCALE ? "grab" : "zoom-in",
                  transform: `rotate(${rotated ? 90 : 0}deg) scale(${scale}) translate(${translate.x / scale}px, ${translate.y / scale}px)`,
                  transformOrigin: "center center",
                  maxWidth: rotated ? "90vh" : "100%",
                  maxHeight: rotated ? "90vw" : "100%",
                }}
              />
            )}
          </div>

          {imageUrls[fullscreenHymn] && (
            <div className="flex items-center justify-center gap-3 border-t border-black/5 bg-background py-3 dark:border-white/10">
              <button
                onClick={zoomOut}
                disabled={scale <= MIN_SCALE}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-black/10 text-foreground/70 transition-colors hover:bg-black/5 disabled:opacity-30 dark:border-white/10 dark:hover:bg-white/10"
              >
                −
              </button>
              <span className="w-12 text-center text-xs text-foreground/50">{Math.round(scale * 100)}%</span>
              <button
                onClick={zoomIn}
                disabled={scale >= MAX_SCALE}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-black/10 text-foreground/70 transition-colors hover:bg-black/5 disabled:opacity-30 dark:border-white/10 dark:hover:bg-white/10"
              >
                ＋
              </button>
              <button
                onClick={toggleRotated}
                className="flex items-center gap-1.5 rounded-full border border-black/10 px-4 py-2 text-sm text-foreground/70 transition-colors hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
              >
                🔄 {rotated ? "세로로 보기" : "가로로 보기"}
              </button>
              <button
                onClick={toggleFullscreen}
                className="flex items-center gap-1.5 rounded-full border border-black/10 px-4 py-2 text-sm text-foreground/70 transition-colors hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
              >
                ⛶ {isFullscreen ? "전체화면 종료" : "전체화면"}
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
