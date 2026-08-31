"use client";

import { useState } from "react";
import NotificationPromptBanner from "@/components/NotificationPromptBanner";
import InstallAppBanner from "@/components/InstallAppBanner";

// 알림 배너를 먼저 보여주고, 그게 닫히거나(또는 애초에 뜰 필요가 없으면)
// 이어서 앱 설치 배너를 보여준다. 두 배너가 동시에 뜨지 않게 순서를 정리한다.
export default function OnboardingBanners() {
  const [notificationDone, setNotificationDone] = useState(false);

  return (
    <>
      <NotificationPromptBanner onResolved={() => setNotificationDone(true)} />
      {notificationDone && <InstallAppBanner />}
    </>
  );
}
