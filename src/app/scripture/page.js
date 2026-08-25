"use client";

import { useEffect, useState } from "react";

const apps = [
  {
    key: "bible",
    title: "성경",
    description: "성경 읽기 앱으로 이동합니다.",
    packageId: "com.sirma.mobile.bible.android",
  },
  {
    key: "hymn",
    title: "찬송가",
    description: "찬송가 앱으로 이동합니다.",
    packageId: "com.new_hymn.data",
  },
];

function playStoreUrl(packageId) {
  return `https://play.google.com/store/apps/details?id=${packageId}&hl=ko`;
}

function androidAppHref(packageId) {
  const fallback = encodeURIComponent(playStoreUrl(packageId));
  return `intent://launch#Intent;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;package=${packageId};S.browser_fallback_url=${fallback};end`;
}

export default function ScripturePage() {
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    setIsAndroid(/Android/i.test(navigator.userAgent));
  }, []);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
      <h1 className="font-serif text-2xl font-bold text-foreground">성경·찬송가</h1>
      <p className="mt-2 text-sm text-foreground/50">
        아래 버튼을 누르면 이미 앱이 설치되어 있는 경우 바로 앱이 열리고, 설치되어 있지 않다면
        Play 스토어로 이동해요.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {apps.map((app) => (
          <a
            key={app.key}
            href={isAndroid ? androidAppHref(app.packageId) : playStoreUrl(app.packageId)}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-black/10 bg-white/60 p-5 transition-colors hover:bg-black/5 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
          >
            <h2 className="font-serif font-semibold text-foreground">{app.title}</h2>
            <p className="mt-1 text-sm text-foreground/60">{app.description}</p>
            <span className="mt-3 inline-block rounded-full bg-brand px-4 py-2 text-sm text-white">
              {app.title} 앱 열기 ↗
            </span>
          </a>
        ))}
      </div>
    </main>
  );
}
