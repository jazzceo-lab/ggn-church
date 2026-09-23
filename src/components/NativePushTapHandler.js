"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { listenNativeNotificationTap } from "@/lib/pushSubscribeNative";

// 안드로이드 앱(Capacitor)에서 FCM 알림을 탭했을 때 해당 경로로 이동시킨다.
// 브라우저에서는 아무 일도 안 함(sw.js의 notificationclick이 그 역할을 대신함).
export default function NativePushTapHandler() {
  const router = useRouter();

  useEffect(() => {
    listenNativeNotificationTap(router);
  }, [router]);

  return null;
}
