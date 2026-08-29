"use client";

import { useEffect } from "react";

export default function KakaoInAppEscape() {
  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (!ua.includes("kakaotalk")) return;

    const currentUrl = window.location.href;

    if (ua.includes("android")) {
      // 카카오톡의 자체 openExternal은 기기 기본 브라우저(삼성인터넷 등)로 열려서
      // 앱설치 배너가 정상 동작하는 크롬으로 강제 지정한다. 크롬이 없으면
      // browser_fallback_url로 기본 브라우저가 대신 열림.
      const hostAndPath = currentUrl.replace(/^https?:\/\//, "");
      window.location.href =
        `intent://${hostAndPath}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(currentUrl)};end`;
    } else {
      window.location.href = "kakaotalk://web/openExternal?url=" + encodeURIComponent(currentUrl);
    }
  }, []);

  return null;
}
