"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
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

function pad(n) {
  return String(n).padStart(3, "0");
}

export default function HymnsPage() {
  const { user, loading: authLoading } = useAuth();
  const [openRange, setOpenRange] = useState(null);
  const [fullscreenHymn, setFullscreenHymn] = useState(null);
  const [imageUrls, setImageUrls] = useState({});
  const [loadingHymn, setLoadingHymn] = useState(null);
  const [hymnError, setHymnError] = useState({});
  const [rotated, setRotated] = useState(false);

  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams(window.location.search);
    const num = parseInt(params.get("open"), 10);
    if (!num || num < 1 || num > TOTAL_HYMNS) return;
    const rangeIdx = RANGES.findIndex((r) => num >= r.start && num <= r.end);
    if (rangeIdx !== -1) setOpenRange(rangeIdx);
    openHymn(num);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  function toggleRange(idx) {
    setOpenRange((prev) => (prev === idx ? null : idx));
  }

  async function openHymn(num) {
    setFullscreenHymn(num);
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
    setFullscreenHymn(null);
    setRotated(false);
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
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
      <h1 className="font-serif text-2xl font-bold text-foreground">찬송가</h1>
      <p className="mt-2 text-sm text-foreground/50">장 범위를 눌러 목록을 펼쳐보세요.</p>

      <div className="mt-6 space-y-2">
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
        <div className="fixed inset-0 z-50 flex flex-col bg-background">
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

          <div className="flex flex-1 items-center justify-center overflow-auto p-2">
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
                className="transition-transform duration-300"
                style={
                  rotated
                    ? { transform: "rotate(90deg)", maxWidth: "90vh", maxHeight: "90vw" }
                    : { maxWidth: "100%" }
                }
              />
            )}
          </div>

          {imageUrls[fullscreenHymn] && (
            <div className="flex justify-center border-t border-black/5 bg-background py-3 dark:border-white/10">
              <button
                onClick={() => setRotated((v) => !v)}
                className="flex items-center gap-1.5 rounded-full border border-black/10 px-4 py-2 text-sm text-foreground/70 transition-colors hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
              >
                🔄 {rotated ? "세로로 보기" : "가로로 보기"}
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
