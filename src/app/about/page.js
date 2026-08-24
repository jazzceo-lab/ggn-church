import NaverMap from "@/components/NaverMap";

export default function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12">
      <h1 className="font-serif text-2xl font-bold text-foreground">교회소개</h1>

      <section className="mt-8 rounded-xl border border-black/10 bg-brand-tint/60 p-6 text-center dark:border-white/10">
        <p className="font-serif text-lg font-semibold text-brand-dark">&ldquo;우리가 하나님의 정원이다&rdquo;</p>
        <p className="mt-2 text-sm text-foreground/70">
          길가는교회는 대한예수교장로회(통합) 부천노회 소속 교회로, 삶의 현장에서 예수님을
          따르며 십자가의 섬김과 나눔의 길을 함께 걸어가는 공동체입니다.
        </p>
      </section>

      <section className="mt-6 rounded-xl border border-black/10 bg-white/60 p-6 dark:border-white/10 dark:bg-white/5">
        <h2 className="font-serif font-semibold text-foreground">담임목사 인사말</h2>
        <div className="mt-4">
          <p className="text-sm leading-7 text-foreground/70">
            길가는교회 홈페이지를 찾아주셔서 감사합니다. 저희 교회는 &ldquo;하나님의
            정원&rdquo;이라는 마음으로, 오늘의 삶의 자리에서 예수님을 따르고 십자가의 섬김과
            나눔을 실천하며 걸어가는 공동체가 되고자 합니다. 누구든지 편안하게 오셔서 함께
            걸어가시길 초대합니다.
          </p>
          <p className="mt-3 text-sm font-medium text-foreground/80">담임목사 임원일 배상</p>
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-black/10 bg-white/60 p-6 dark:border-white/10 dark:bg-white/5">
        <h2 className="font-serif font-semibold text-foreground">예배 안내</h2>
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-sm font-semibold text-brand-dark">주일예배</p>
            <ul className="mt-2 space-y-1 text-sm text-foreground/70">
              <li>주일예배 · 오전 11:30</li>
              <li>새벽예배 (화~금) · 오전 05:30</li>
              <li>찬양의 밤 (매월 1회 금요일) · 저녁 08:00</li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-brand-dark">교회학교예배</p>
            <ul className="mt-2 space-y-1 text-sm text-foreground/70">
              <li>영유아부 · 오전 11:30 (영유아부실)</li>
              <li>아동부 · 오전 09:40 (아동부실)</li>
              <li>청소년부 · 오전 09:30 (청소년부실)</li>
              <li>청년부 · 오후 01:40 (청년부실)</li>
              <li>백향숲 · 오후 02:00 (본당)</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-black/10 bg-white/60 p-6 dark:border-white/10 dark:bg-white/5">
        <h2 className="font-serif font-semibold text-foreground">오시는 길</h2>
        <p className="mt-3 text-sm leading-6 text-foreground/70">
          경기도 부천시 원미구 중동로248번길 52, 9층
          <br />
          (중동 1145-2번지)
        </p>
        <p className="mt-2 text-sm text-foreground/70">TEL. 032-321-9182</p>
        <div className="mt-4">
          <NaverMap />
        </div>
      </section>
    </main>
  );
}
