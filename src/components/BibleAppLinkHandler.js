"use client";

import { useEffect } from "react";

// 주보·청년부 주보·오늘의 말씀의 성경구절(bible.com 링크)을 안드로이드에서 누르면,
// 성경 앱(YouVersion)이 있으면 해당 구절로 바로 열고, 없으면 성경 메뉴처럼 플레이스토어
// 설치 화면으로 보낸다. intent:// 의 package 지정 + browser_fallback_url이 이 분기를
// OS가 대신 해준다(앱 안 WebView에서는 MainActivity가 같은 규칙으로 처리).
// 아이폰은 bible.com 링크가 유니버설 링크라 앱이 있으면 이미 앱으로 열려서 그대로 둔다.
const PACKAGE = "com.sirma.mobile.bible.android";
const STORE_URL = `https://play.google.com/store/apps/details?id=${PACKAGE}&hl=ko`;

export default function BibleAppLinkHandler() {
  useEffect(() => {
    if (!/android/i.test(navigator.userAgent)) return;

    function onClick(e) {
      const a = e.target.closest?.("a[href^='https://www.bible.com/']");
      if (!a) return;
      e.preventDefault();
      const hostAndPath = a.href.replace(/^https:\/\//, "");
      window.location.href =
        `intent://${hostAndPath}#Intent;scheme=https;package=${PACKAGE};S.browser_fallback_url=${encodeURIComponent(STORE_URL)};end`;
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
