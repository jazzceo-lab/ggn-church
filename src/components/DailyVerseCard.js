"use client";

import { useState } from "react";
import { buildBibleLink } from "@/lib/bibleBooks";
import { DAILY_VERSES } from "@/lib/dailyVerses";

export default function DailyVerseCard({ initialVerse }) {
  const [verse, setVerse] = useState(initialVerse);
  const verseLink = buildBibleLink(verse.ref);

  function showAnother() {
    if (DAILY_VERSES.length <= 1) return;
    let next;
    do {
      next = DAILY_VERSES[Math.floor(Math.random() * DAILY_VERSES.length)];
    } while (next.ref === verse.ref);
    setVerse(next);
  }

  return (
    <section className="mt-4 rounded-xl border border-black/10 bg-brand-tint/60 p-4 dark:border-white/10">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-serif font-semibold text-brand-dark">오늘의 성경</h2>
        <button
          type="button"
          onClick={showAnother}
          className="shrink-0 rounded-full border border-brand-dark/40 bg-white px-3 py-1 text-xs font-medium text-brand-dark shadow-sm transition-colors hover:bg-brand-dark hover:text-white dark:bg-black/30 dark:text-brand"
        >
          다른 구절 보기
        </button>
      </div>
      <p className="mt-2 break-keep text-sm leading-6 text-foreground/80">&ldquo;{verse.text}&rdquo;</p>
      {verseLink ? (
        <a
          href={verseLink}
          className="mt-1 inline-block text-sm font-medium text-brand-dark underline decoration-brand-dark/40 underline-offset-2"
        >
          {verse.ref}
        </a>
      ) : (
        <p className="mt-1 text-sm font-medium text-brand-dark">{verse.ref}</p>
      )}
    </section>
  );
}
