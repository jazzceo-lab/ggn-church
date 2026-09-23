"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { listenNativeNotificationTap, clearNativeNotificationsOnResume } from "@/lib/pushSubscribeNative";

// 안드로이드 앱(Capacitor)에서 FCM 알림을 탭했을 때 해당 경로로 이동시키고,
// 앱을 열 때마다 알림/배지를 정리한다. 브라우저에서는 둘 다 아무 일 안 함
// (sw.js의 notificationclick이 그 역할을 대신함).
export default function NativePushTapHandler() {
  const router = useRouter();

  useEffect(() => {
    listenNativeNotificationTap(router);
    clearNativeNotificationsOnResume();
  }, [router]);

  return null;
}
