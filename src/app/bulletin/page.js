const bulletin = {
  issue: "27권 34호",
  date: "2026. 8. 23",
  theme: {
    year: "2026년 표어",
    verse: "매일, 매사에 겸손히 하나님과 동행하자! (미가 6:8)",
    goals: [
      "마음에 할례를 받자! (신 30:6)",
      "하나님의 뜻을 분별하자! (롬 12:2)",
      "긍휼, 정의, 공의를 실천하자! (렘 9:24)",
    ],
  },
  prayers: [
    "우리가 살아온 먼 길을 돌아보며 끊임없이 일하시는 하나님의 섭리의 손길을 깨달아 알도록",
    "아직도 회복되지 않은 북한 땅에도 하나님의 섭리의 손길 안에서 부활의 새 역사가 이뤄지길",
    "교회의 리더십 변화의 때에 모든 항존직이 든든한 교회의 기둥으로서 제 역할을 다하도록",
    "담임목사 청빙위원회 구성을 필두로 리더십 변화의 때에 온 교회가 기도로 참여하도록",
  ],
  order: [
    ["인사와 나눔", ""],
    ["묵도", ""],
    ["찬송", "주 우리 하나님 14장 (1,4절)"],
    ["기원", ""],
    ["교독문", "9번 (시편 15편)"],
    ["신앙고백", "사도신경"],
    ["찬송", "삼천리 반도 금수강산 580장"],
    ["기도", "노희일 집사"],
    ["성경봉독", "이사야 51:1~3 · 신유정 집사"],
    ["찬양대", "주님 약속하신 말씀 위에서"],
    ["말씀", "임원일 목사 · 「멀리 1,300년 전을 돌아봐라」"],
    ["기도", ""],
    ["찬송", "어둔 밤 마음에 잠겨 582장"],
    ["헌금기도", ""],
    ["축도", ""],
  ],
  news: [
    "식탁 교제 / 낮 예배 후 온 교우가 함께하는 식탁교제가 있습니다.",
    "당회 / 오늘 오후 3시 30분, 교역자실",
    "항존직 재교육 / 7월~8월 매주일 오후 2시, 본당",
    "청소년부, 청년부(1,2청) 찬양 집회 / 9월 5일(토) 저녁 8시, 청소년·청년부실",
    "구역장 성경공부 개강 / 9월 6일(주일) 오후 4시",
    "백향숲 개강 / 9월 6일(주일) 오후 2시",
    "금요기도회 / 8월 28일(금) 저녁 8시 · 찬양과 기도의 자리에 많은 참여를 바랍니다.",
    "이사 / 정상우 목사 가정",
    "다음주 예배위원 / 기도: 조태형 집사, 성경봉독: 양혜림 집사",
    "헌금 계좌 / 일반헌금 [농협] 141-01-317160 · 건축헌금 [농협] 301-0141-2913-81",
  ],
  staff: [
    ["교역자", "임원일, 정상우, 송혜영, 김태민"],
    ["장로", "김택영, 최학수, 주현진, 이건주, 김윤태"],
    ["후원선교사", "권성찬, 최미언"],
    ["성가대지휘", "나혜라"],
    ["반주", "최진아, 양혜림"],
  ],
};

export default function BulletinPage() {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12">
      <div className="flex items-baseline justify-between">
        <h1 className="font-serif text-2xl font-bold text-foreground">주보</h1>
        <p className="text-sm text-foreground/50">
          {bulletin.issue} · {bulletin.date}
        </p>
      </div>

      <section className="mt-8 rounded-xl border border-black/10 bg-brand-tint/60 p-5 dark:border-white/10">
        <p className="text-sm font-medium text-brand-dark">{bulletin.theme.year}</p>
        <p className="mt-1 font-serif text-lg font-semibold text-foreground">
          &ldquo;{bulletin.theme.verse}&rdquo;
        </p>
        <ol className="mt-4 space-y-1 text-sm text-foreground/70">
          {bulletin.theme.goals.map((goal, i) => (
            <li key={i}>
              {i + 1}. {goal}
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-6 rounded-xl border border-black/10 bg-white/60 p-5 dark:border-white/10 dark:bg-white/5">
        <h2 className="font-serif font-semibold text-foreground">기도제목</h2>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-foreground/70">
          {bulletin.prayers.map((p, i) => (
            <li key={i}>· {p}</li>
          ))}
        </ul>
      </section>

      <section className="mt-6 rounded-xl border border-black/10 bg-white/60 p-5 dark:border-white/10 dark:bg-white/5">
        <div className="flex items-baseline justify-between">
          <h2 className="font-serif font-semibold text-foreground">예배순서</h2>
          <p className="text-sm text-foreground/50">오전 11:30 · 인도 임원일 목사</p>
        </div>
        <ul className="mt-3 divide-y divide-black/5 text-sm dark:divide-white/10">
          {bulletin.order.map(([label, detail], i) => (
            <li key={i} className="flex items-center justify-between gap-4 py-2">
              <span className="w-24 shrink-0 font-medium text-foreground/80">{label}</span>
              <span className="text-right text-foreground/60">{detail}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 rounded-xl border border-black/10 bg-white/60 p-5 dark:border-white/10 dark:bg-white/5">
        <h2 className="font-serif font-semibold text-foreground">교회소식</h2>
        <ol className="mt-3 space-y-2 text-sm leading-6 text-foreground/70">
          {bulletin.news.map((n, i) => (
            <li key={i}>
              {i + 1}. {n}
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-6 rounded-xl border border-black/10 bg-white/60 p-5 dark:border-white/10 dark:bg-white/5">
        <h2 className="font-serif font-semibold text-foreground">섬김이</h2>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          {bulletin.staff.map(([role, names]) => (
            <div key={role} className="flex gap-2">
              <dt className="w-24 shrink-0 text-foreground/50">{role}</dt>
              <dd className="text-foreground/80">{names}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
