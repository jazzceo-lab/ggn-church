"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function DailyVerseCardInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [verse, setVerse] = useState({
    ref: params.get("ref") || "",
    text: params.get("text") || "",
  });
  const [verses, setVerses] = useState([]);

  useEffect(() => {
    supabase
      .from("daily_verses")
      .select("ref, verse_text")
      .order("id", { ascending: true })
      .then(({ data }) => setVerses((data ?? []).map((v) => ({ ref: v.ref, text: v.verse_text }))));
  }, []);

  function showAnotherVerse() {
    if (verses.length === 0) return;
    const others = verses.filter((v) => v.ref !== verse.ref);
    const pool = others.length > 0 ? others : verses;
    setVerse(pool[Math.floor(Math.random() * pool.length)]);
  }

  // portrait 파라미터 없이 가로형(1200x630) 이미지를 받아, 화면 전체를 90도 회전시켜
  // 세로로 든 폰에서도 가로모드 전체화면처럼 크게 보이게 한다(구절이 작게 눌려 보이던 문제 해결).
  const imageUrl = `/api/daily-verse-image?ref=${encodeURIComponent(verse.ref)}&text=${encodeURIComponent(verse.text)}`;

  return (
    <div className="fixed inset-0 z-50 bg-black overflow-hidden">
      <div
        className="absolute top-1/2 left-1/2 flex items-center justify-center"
        style={{ width: "100vh", height: "100vw", transform: "translate(-50%, -50%) rotate(90deg)" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt={verse.ref} className="w-full h-full object-contain" />
        <button
          onClick={showAnotherVerse}
          disabled={verses.length === 0}
          className="absolute top-4 right-4 h-9 px-4 rounded-full bg-black/40 text-white text-sm font-medium flex items-center justify-center backdrop-blur-sm disabled:opacity-40"
          aria-label="다른 구절 보기"
        >
          다른구절보기
        </button>
        <button
          onClick={() => router.push("/")}
          className="absolute bottom-6 right-4 h-9 px-4 rounded-full bg-black/40 text-white text-sm font-medium flex items-center justify-center backdrop-blur-sm"
          aria-label="그만보기"
        >
          그만보기
        </button>
      </div>
    </div>
  );
}

export default function DailyVerseCardPage() {
  return (
    <Suspense fallback={<div className="fixed inset-0 bg-black" />}>
      <DailyVerseCardInner />
    </Suspense>
  );
}
