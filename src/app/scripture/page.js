import { buildBibleLink } from "@/lib/bibleBooks";
import { getTodayVerse } from "@/lib/dailyVerses";

export const dynamic = "force-dynamic";

const apps = [
  {
    key: "bible",
    title: "성경",
    description: "성경 읽기 앱으로 이동합니다.",
    url: "https://www.bible.com/",
  },
];

export default function ScripturePage() {
  const verse = getTodayVerse();
  const verseLink = buildBibleLink(verse.ref);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-3 pb-12">
      <h1 className="font-serif text-2xl font-bold text-foreground">성경</h1>
      <p className="mt-2 text-sm text-foreground/50">
        아래 버튼을 누르면 이미 앱이 설치되어 있는 경우 바로 앱이 열리고, 설치되어 있지 않다면
        웹사이트로 이동해요.
      </p>

      <section className="mt-6 rounded-xl border border-black/10 bg-brand-tint/60 p-5 dark:border-white/10">
        <h2 className="font-serif font-semibold text-brand-dark">오늘의 성경</h2>
        <p className="mt-3 break-keep text-sm leading-7 text-foreground/80">
          &ldquo;{verse.text}&rdquo;
        </p>
        {verseLink ? (
          <a
            href={verseLink}
            className="mt-2 inline-block text-sm font-medium text-brand-dark underline decoration-brand-dark/40 underline-offset-2"
          >
            {verse.ref}
          </a>
        ) : (
          <p className="mt-2 text-sm font-medium text-brand-dark">{verse.ref}</p>
        )}
      </section>

      <div className="mt-6 grid gap-4">
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
