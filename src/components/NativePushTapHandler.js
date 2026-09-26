"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import {
  listenNativeNotificationTap,
  clearNativeNotificationsOnResume,
  isNativePushSubscribed,
  subscribeNativePush,
} from "@/lib/pushSubscribeNative";

// 안드로이드 앱(Capacitor)에서 FCM 알림을 탭했을 때 해당 경로로 이동시키고,
// 앱을 열 때마다 알림/배지를 정리한다. 브라우저에서는 둘 다 아무 일 안 함
// (sw.js의 notificationclick이 그 역할을 대신함).
//
// 네이티브 앱은 앱 안에 별도 🔔 버튼이 없으므로(PushSubscribeButton.js 참고,
// OS 설정으로만 켜고 끄는 일반적인 앱 방식), 로그인 후 아직 등록 안 된 사용자는
// 여기서 조용히 자동으로 알림 권한을 요청/등록한다.
export default function NativePushTapHandler() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    listenNativeNotificationTap(router);
    clearNativeNotificationsOnResume();
  }, [router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { Capacitor } = await import("@capacitor/core");
      if (!Capacitor.isNativePlatform()) return;
      if (await isNativePushSubscribed(user)) return;
      const { error } = await subscribeNativePush(user);
      // 임시 진단용: 자동등록이 왜 실패하는지 화면에서 바로 보이게(추후 원인 파악되면 제거).
      if (error && typeof window !== "undefined") window.alert("알림 자동등록 실패: " + error);
    })();
  }, [user]);

  return null;
}
