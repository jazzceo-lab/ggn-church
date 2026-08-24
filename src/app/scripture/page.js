const apps = [
  {
    key: "bible",
    title: "성경",
    description: "성경 읽기 앱으로 이동합니다.",
    url: "https://play.google.com/store/apps/details?id=com.sirma.mobile.bible.android&hl=ko",
  },
  {
    key: "hymn",
    title: "찬송가",
    description: "찬송가 앱으로 이동합니다.",
    url: "https://play.google.com/store/apps/details?id=com.new_hymn.data&hl=ko",
  },
];

export default function ScripturePage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
      <h1 className="font-serif text-2xl font-bold text-foreground">성경·찬송가</h1>
      <p className="mt-2 text-sm text-foreground/50">
        아래 버튼을 누르면 앱스토어(Play 스토어)로 이동해요. 이미 앱이 설치되어 있다면 앱이 바로
        열릴 수도 있어요.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {apps.map((app) => (
          <a
            key={app.key}
            href={app.url}
            target="_blank"
            rel="noopener noreferrer"
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
