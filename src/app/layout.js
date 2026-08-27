import { Noto_Sans_KR, Noto_Serif_KR } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";
import { AuthProvider } from "@/components/AuthProvider";
import PopupNotice from "@/components/PopupNotice";

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
  themeColor: "#c19c89",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="ko"
      className={`${notoSans.variable} ${notoSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <AuthProvider>
          <PopupNotice />
          <NavBar />
          <div className="flex flex-1 flex-col">{children}</div>
          <footer className="border-t border-black/10 py-6 text-center text-xs text-foreground/50 dark:border-white/10">
            © {new Date().getFullYear()} 길가는교회
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
