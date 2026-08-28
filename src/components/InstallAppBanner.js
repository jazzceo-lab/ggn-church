"use client";

import { useEffect, useState } from "react";

const DISMISS_KEY = "installBannerDismissedAt";
const DISMISS_DAYS = 14;

export default function InstallAppBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
    if (isStandalone) return;

    const dismissedAt = Number(window.localStorage.getItem(DISMISS_KEY) || 0);
    if (Date.now() - dismissedAt < DISMISS_DAYS * 24 * 60 * 60 * 1000) return;

    function handleBeforeInstallPrompt(e) {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    }
    function handleAppInstalled() {
      setVisible(false);
      setDeferredPrompt(null);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
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
    window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between gap-3 bg-brand px-4 py-2.5 text-sm text-white">
      <span className="break-keep">📲 길가는교회 앱을 폰 화면에 설치해두면 더 편하게 쓸 수 있어요.</span>
      <div className="flex shrink-0 items-center gap-2">
        <button
          onClick={handleInstall}
          className="rounded-full bg-white px-3 py-1 font-medium text-brand-dark"
        >
          설치
        </button>
        <button onClick={handleDismiss} aria-label="닫기" className="px-1 text-white/80">
          ✕
        </button>
      </div>
    </div>
  );
}
