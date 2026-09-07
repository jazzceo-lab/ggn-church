"use client";

import { useEffect } from "react";

// 홈 화면에 설치한 회원들이 새 배포를 받으려면 캐시를 수동으로 지워야 했던 문제를 고치기
// 위한 컴포넌트. sw.js가 새로 배포되어 새 서비스워커가 활성화되면(=controllerchange)
// 페이지를 한 번 자동으로 새로고침해서 최신 화면을 바로 받아오게 한다. 앱을 다시 열거나
// 화면에 복귀할 때마다 새 버전이 있는지도 확인한다.
export default function PwaUpdater() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let reloading = false;
    let registration = null;

    function handleControllerChange() {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    }

    function checkForUpdate() {
      if (document.visibilityState === "visible") registration?.update().catch(() => {});
    }

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);
    document.addEventListener("visibilitychange", checkForUpdate);
    window.addEventListener("focus", checkForUpdate);

    navigator.serviceWorker.register("/sw.js").then((reg) => {
      registration = reg;
    });

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
      document.removeEventListener("visibilitychange", checkForUpdate);
      window.removeEventListener("focus", checkForUpdate);
    };
  }, []);

  return null;
}
