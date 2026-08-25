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
      className="inline-flex shrink-0 items-center gap-1 rounded-full border border-black/10 px-3 py-1.5 text-xs text-foreground/70 transition-colors hover:bg-black/5 disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/10"
    >
      💬 카톡 공유
    </button>
  );
}
