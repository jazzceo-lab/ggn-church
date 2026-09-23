"use client";

import { useEffect } from "react";

// 안드로이드 앱(Capacitor)에서만 실행. 새 버전이 있으면 Play가 제공하는
// "즉시 업데이트" 전체화면 UI를 띄워서 업데이트를 강제한다 — 웹처럼 배포만
// 하면 바로 반영되는 게 아니라 AAB를 새로 올려야 하는 네이티브 셸이라,
// 교인들이 예전 버전에 머물러 있는 걸 방지하려는 목적.
export default function NativeAppUpdateChecker() {
  useEffect(() => {
    (async () => {
      const { Capacitor } = await import("@capacitor/core");
      if (!Capacitor.isNativePlatform()) return;

      const { AppUpdate, AppUpdateAvailability } = await import("@capawesome/capacitor-app-update");
      try {
        const info = await AppUpdate.getAppUpdateInfo();
        if (
          info.updateAvailability === AppUpdateAvailability.UPDATE_AVAILABLE &&
          info.immediateUpdateAllowed
        ) {
          await AppUpdate.performImmediateUpdate();
        }
      } catch {
        // 오프라인이거나 Play 서비스 없는 기기 등 — 조용히 무시, 앱은 평소대로 계속 사용
      }
    })();
  }, []);

  return null;
}
