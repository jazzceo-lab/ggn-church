"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

// 안드로이드 앱(Capacitor)에서만 실행.
// 1) Play 인앱 업데이트: 새 버전이 있으면 Play의 "즉시 업데이트" 전체화면을 띄운다.
// 2) 보완: 테스트 트랙·Play 스토어 캐시 때문에 1)이 안 뜨는 경우가 많아서, DB의
//    app_version.latest_version_code보다 설치된 앱 버전이 낮으면 직접 안내창을 띄운다.
// 이 파일은 웹에서 불러오는 코드라 AAB 재빌드 없이 반영된다(App 플러그인은 v8부터 앱에 포함).
export default function NativeAppUpdateChecker() {
  const [updateUrl, setUpdateUrl] = useState(null);

  useEffect(() => {
    (async () => {
      const { Capacitor } = await import("@capacitor/core");
      if (!Capacitor.isNativePlatform()) return;

      try {
        const { AppUpdate, AppUpdateAvailability } = await import("@capawesome/capacitor-app-update");
        const info = await AppUpdate.getAppUpdateInfo();
        if (info.updateAvailability === AppUpdateAvailability.UPDATE_AVAILABLE && info.immediateUpdateAllowed) {
          await AppUpdate.performImmediateUpdate();
          return;
        }
      } catch {
        // Play 서비스 없음·테스트 트랙 등 — 아래 보완 확인으로 넘어간다.
      }

      try {
        const { App } = await import("@capacitor/app");
        const [{ build }, { data }] = await Promise.all([
          App.getInfo(),
          supabase.from("app_version").select("latest_version_code, update_url").eq("id", 1).maybeSingle(),
        ]);
        if (data && Number(build) < data.latest_version_code) setUpdateUrl(data.update_url);
      } catch {
        // 오프라인 등 — 조용히 무시, 앱은 평소대로 사용
      }
    })();
  }, []);

  if (!updateUrl) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-brand/30 bg-background p-4 shadow-lg">
      <div className="mx-auto flex max-w-3xl items-center gap-3">
        <p className="flex-1 text-sm text-foreground">📱 새 버전이 나왔어요. 업데이트해 주세요.</p>
        <button type="button" onClick={() => setUpdateUrl(null)} className="shrink-0 text-xs text-foreground/50">
          나중에
        </button>
        <a
          href={updateUrl}
          className="shrink-0 rounded-full bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
        >
          업데이트
        </a>
      </div>
    </div>
  );
}
