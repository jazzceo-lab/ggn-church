import type { CapacitorConfig } from "@capacitor/cli";

// 웹 콘텐츠를 앱 안에 번들로 넣지 않고, 실제 배포된 사이트를 그대로 원격 로딩한다.
// Vercel 배포가 그대로 앱 화면의 원본이라 웹 쪽 배포만 하면 앱도 즉시 최신 반영됨
// (네이티브 셸/설정만 바뀔 때만 새 AAB가 필요).
const config: CapacitorConfig = {
  appId: "shop.ggnch.twa",
  appName: "길가는교회",
  server: {
    url: "https://www.ggnch.shop",
    androidScheme: "https",
  },
};

export default config;
