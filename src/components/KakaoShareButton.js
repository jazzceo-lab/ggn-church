"use client";

import { useEffect, useState } from "react";
import { KAKAO_JS_KEY } from "@/lib/kakaoConfig";

let sdkLoadPromise = null;

function loadKakaoSdk() {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.Kakao) return Promise.resolve();
  if (sdkLoadPromise) return sdkLoadPromise;
  sdkLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://developers.kakao.com/sdk/js/kakao.min.js";
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
  return sdkLoadPromise;
}

export default function KakaoShareButton({ title, description, url }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!KAKAO_JS_KEY) return;
    loadKakaoSdk().then(() => {
      if (window.Kakao && !window.Kakao.isInitialized()) {
        window.Kakao.init(KAKAO_JS_KEY);
      }
      setReady(true);
    });
  }, []);

  if (!KAKAO_JS_KEY) return null;

  function handleShare() {
    if (!ready || !window.Kakao) return;
    const shareUrl = url || window.location.href;
    window.Kakao.Share.sendDefault({
      objectType: "feed",
      content: {
        title,
        description,
        imageUrl: `${window.location.origin}/images/logo-mark.jpg`,
        link: { mobileWebUrl: shareUrl, webUrl: shareUrl },
      },
      buttons: [
        {
          title: "자세히 보기",
          link: { mobileWebUrl: shareUrl, webUrl: shareUrl },
        },
      ],
    });
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={!ready}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-black/10 px-3 py-1.5 text-xs text-foreground/70 transition-colors hover:bg-black/5 disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/10"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden="true">
        <rect width="24" height="24" rx="7" fill="#FEE500" />
        <path
          d="M12 5.5c-3.87 0-7 2.44-7 5.45 0 1.94 1.3 3.64 3.26 4.61-.14.52-.5 1.86-.58 2.15-.1.36.13.36.28.26.11-.08 1.8-1.22 2.53-1.72.48.07.99.1 1.51.1 3.87 0 7-2.44 7-5.4s-3.13-5.45-7-5.45Z"
          fill="#3C1E1E"
        />
      </svg>
      카톡 공유
    </button>
  );
}
