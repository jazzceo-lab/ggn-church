"use client";

import NotificationPromptBanner from "@/components/NotificationPromptBanner";

// Play 스토어로 앱을 설치하는 게 기본 경로가 되면서 "홈 화면에 추가" 안내
// 배너(InstallAppBanner)는 더 이상 필요 없어져 제거함. 알림 권한 배너는
// 설치 경로와 무관하게 여전히 필요해서 유지.
export default function OnboardingBanners() {
  return <NotificationPromptBanner />;
}
