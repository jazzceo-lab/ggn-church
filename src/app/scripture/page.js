import { getTodayVerse } from "@/lib/dailyVerses";
import DailyVerseCard from "@/components/DailyVerseCard";

export const dynamic = "force-dynamic";

// bible.com 웹사이트 링크는 앱이 설치되어 있지 않으면 그냥 웹사이트로만 이동해서
// 앱 설치로 이어지지 않았음. 플레이스토어 앱 페이지로 연결하면 설치되어 있을 때는
// "열기", 없을 때는 "설치" 버튼이 자동으로 떠서 항상 원하는 동작으로 이어짐.
const apps = [
  {
    key: "bible",
    title: "성경",
    description: "성경 읽기 앱으로 이동합니다.",
    url: "https://play.google.com/store/apps/details?id=com.sirma.mobile.bible.android&hl=ko",
  },
];

export default function ScripturePage() {
  const verse = getTodayVerse();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-3 pb-12">
      <h1 className="font-serif text-2xl font-bold text-foreground">성경</h1>

      <DailyVerseCard initialVerse={verse} />

      <p className="mt-4 text-sm text-foreground/50">
        아래 버튼을 누르면 플레이스토어로 이동해요. 이미 앱이 설치되어 있으면 &ldquo;열기&rdquo;,
        설치되어 있지 않으면 &ldquo;설치&rdquo; 버튼이 떠요.
      </p>

      <div className="mt-3 grid gap-4">
        {apps.map((app) => (
          <a
            key={app.key}
            href={app.url}
            className="rounded-xl border border-black/10 bg-white/60 p-5 transition-colors hover:bg-black/5 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
          >
            <h2 className="font-serif font-semibold text-foreground">{app.title}</h2>
            <p className="mt-1 text-sm text-foreground/60">{app.description}</p>
            <span className="mt-3 inline-block rounded-full bg-brand px-4 py-2 text-sm text-white">
              {app.title} 앱 열기 ↗
            </span>
          </a>
        ))}
      </div>
    </main>
  );
}
