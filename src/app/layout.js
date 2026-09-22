import { Noto_Sans_KR, Noto_Serif_KR } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";
import { AuthProvider } from "@/components/AuthProvider";
import PopupNotice from "@/components/PopupNotice";
import OnboardingBanners from "@/components/OnboardingBanners";
import KakaoInAppEscape from "@/components/KakaoInAppEscape";
import ScrollFadeBottom from "@/components/ScrollFadeBottom";
import MessageFab from "@/components/MessageFab";
import PwaUpdater from "@/components/PwaUpdater";

const notoSans = Noto_Sans_KR({
  variable: "--font-sans-kr",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const notoSerif = Noto_Serif_KR({
  variable: "--font-serif-kr",
  subsets: ["latin"],
  weight: ["500", "700"],
});

export const metadata = {
  title: "길가는교회",
  description: "길가는교회 교회 앱",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "길가는교회",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#c19c89",
  // 이게 없으면 시스템이 다크 테마인 기기에서 크롬/안드로이드가 "이 페이지는
  // 다크모드를 자체 지원 안 함"으로 보고 색을 강제로 보정해버려서, 앱 자체의
  // 라이트/다크 전환(ThemeToggle)과 무관하게 항상 어둡게 보이는 문제가 있었음.
  colorScheme: "light dark",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="ko"
      className={`${notoSans.variable} ${notoSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <PwaUpdater />
        <KakaoInAppEscape />
        <AuthProvider>
          <OnboardingBanners />
          <PopupNotice />
          <NavBar />
          <div className="flex flex-1 flex-col">{children}</div>
          <footer className="border-t border-black/10 py-6 text-center text-xs text-foreground/50 dark:border-white/10">
            © {new Date().getFullYear()} 길가는교회
          </footer>
          <ScrollFadeBottom />
          <MessageFab />
        </AuthProvider>
      </body>
    </html>
  );
}
