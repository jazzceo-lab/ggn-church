"use client";

import { useEffect, useState } from "react";

export default function InstallAppButton() {
  const [promptEvent, setPromptEvent] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone
    ) {
      setInstalled(true);
    }
    setIsIOS(/iphone|ipad|ipod/i.test(window.navigator.userAgent));

    function onBeforeInstallPrompt(e) {
      e.preventDefault();
      setPromptEvent(e);
    }
    function onAppInstalled() {
      setInstalled(true);
      setPromptEvent(null);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  async function handleInstallClick() {
    if (!promptEvent) return;
    promptEvent.prompt();
    await promptEvent.userChoice;
    setPromptEvent(null);
  }

  if (installed) return null;

  return (
    <div className="mx-auto mt-8 max-w-md rounded-xl border border-black/10 bg-brand-tint/60 p-5 text-center dark:border-white/10">
      {promptEvent ? (
        <>
          <p className="text-sm text-foreground/70">앱처럼 편하게 쓰시려면 홈 화면에 추가해보세요.</p>
          <button
            onClick={handleInstallClick}
            className="mt-3 rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
          >
            📱 홈 화면에 앱 추가하기
          </button>
        </>
      ) : isIOS ? (
        <>
          <p className="text-sm font-medium text-brand-dark">📱 홈 화면에 추가하는 법 (아이폰)</p>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-left text-sm text-foreground/70">
            <li>Safari 브라우저로 이 화면을 열어주세요</li>
            <li>화면 아래쪽 공유 버튼(네모에 화살표)을 눌러주세요</li>
            <li>&ldquo;홈 화면에 추가&rdquo;를 눌러주세요</li>
            <li>&ldquo;추가&rdquo;를 누르면 바탕화면에 아이콘이 생겨요</li>
          </ol>
        </>
      ) : (
        <>
          <p className="text-sm font-medium text-brand-dark">📱 홈 화면에 추가하는 법 (안드로이드)</p>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-left text-sm text-foreground/70">
            <li>Chrome 브라우저로 이 화면을 열어주세요</li>
            <li>오른쪽 위 점 3개(⋮) 버튼을 눌러주세요</li>
            <li>&ldquo;홈 화면에 추가&rdquo; 또는 &ldquo;앱 설치&rdquo;를 눌러주세요</li>
            <li>&ldquo;추가&rdquo;를 누르면 바탕화면에 아이콘이 생겨요</li>
          </ol>
        </>
      )}
    </div>
  );
}
