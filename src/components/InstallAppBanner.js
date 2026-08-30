"use client";

import { useEffect, useState } from "react";
import { safeGetItem, safeSetItem } from "@/lib/safeStorage";

const DISMISS_KEY = "installBannerDismissedAt";
const INSTALLED_KEY = "pwaInstalled";
const DISMISS_DAYS = 14;
const FALLBACK_DELAY_MS = 3000;

export default function InstallAppBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [manualFallback, setManualFallback] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
    if (isStandalone) {
      // 홈 화면 아이콘으로 실행된 것이 확인됐으니, 나중에 같은 기기의 일반
      // 브라우저 탭으로 접속해도 설치 안내를 다시 띄우지 않도록 기억해둔다.
      safeSetItem(INSTALLED_KEY, "1");
      return;
    }

    // 이미 설치된 적이 있는 기기라면(일반 브라우저 탭으로 접속한 경우 포함) 안내를 건너뛴다.
    if (safeGetItem(INSTALLED_KEY) === "1") return;

    const dismissedAt = Number(safeGetItem(DISMISS_KEY) || 0);
    if (Date.now() - dismissedAt < DISMISS_DAYS * 24 * 60 * 60 * 1000) return;

    // iOS Safari(카카오톡에서 외부 브라우저로 열었을 때 포함)는 beforeinstallprompt
    // 자체를 지원하지 않아서 이벤트를 기다리지 않고 바로 수동 설치 안내를 띄운다.
    if (/iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase())) {
      setIsIOS(true);
      setVisible(true);
      return;
    }

    let fallbackTimer;

    function handleBeforeInstallPrompt(e) {
      e.preventDefault();
      clearTimeout(fallbackTimer);
      setDeferredPrompt(e);
      setManualFallback(false);
      setVisible(true);
    }
    function handleAppInstalled() {
      safeSetItem(INSTALLED_KEY, "1");
      setVisible(false);
      setDeferredPrompt(null);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // 크롬이 참여도 판단 등으로 beforeinstallprompt를 바로 안 내려줄 때를 대비해,
    // 잠깐 기다렸다가 크롬 메뉴로 직접 설치하는 방법을 안내하는 배너로 대체한다.
    // 이후 이벤트가 실제로 도착하면 설치 버튼이 있는 배너로 교체된다.
    fallbackTimer = setTimeout(() => {
      setManualFallback(true);
      setVisible(true);
    }, FALLBACK_DELAY_MS);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      clearTimeout(fallbackTimer);
    };
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
  }

  function handleDismiss() {
    safeSetItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between gap-3 bg-brand px-4 py-2.5 text-sm text-white">
      <span className="break-keep">
        {isIOS
          ? "📲 하단 공유 버튼 → \"홈 화면에 추가\"를 누르면 앱처럼 쓸 수 있어요."
          : manualFallback
            ? "📲 오른쪽 위 ⋮ 메뉴 → \"설치 및 바로가기\"를 누르면 길가는교회 앱을 설치할 수 있어요."
            : "📲 길가는교회 앱을 폰 화면에 설치해두면 더 편하게 쓸 수 있어요."}
      </span>
      <div className="flex shrink-0 items-center gap-2">
        {!isIOS && !manualFallback && (
          <button
            onClick={handleInstall}
            className="rounded-full bg-white px-3 py-1 font-medium text-brand-dark"
          >
            설치
          </button>
        )}
        <button onClick={handleDismiss} aria-label="닫기" className="px-1 text-white/80">
          ✕
        </button>
      </div>
    </div>
  );
}
