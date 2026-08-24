import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex-1">
      <section className="relative overflow-hidden">
        <div className="relative h-[220px] w-full sm:h-[300px]">
          <Image
            src="/images/hero-banner.jpg"
            alt="길가는교회"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
        </div>
      </section>

      <div className="mx-auto w-full max-w-4xl px-4 py-12">
        <section className="text-center">
          <h1 className="font-serif text-3xl font-bold text-foreground">
            길가는교회에 오신 것을 환영합니다
          </h1>
          <p className="mt-3 text-foreground/60">
            매일, 매사에 겸손히 하나님과 동행하는 신앙 공동체입니다.
          </p>
        </section>

        <section className="mt-12 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-black/10 bg-white/60 p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
            <h2 className="font-serif font-semibold text-foreground">예배 안내</h2>
            <ul className="mt-2 space-y-1 text-sm text-foreground/70">
              <li>주일예배 · 오전 11:30</li>
              <li>새벽예배 (화~금) · 오전 05:30</li>
              <li>찬양의 밤 (매월 1회 금요일) · 저녁 08:00</li>
            </ul>
          </div>
          <div className="rounded-xl border border-black/10 bg-white/60 p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
            <h2 className="font-serif font-semibold text-foreground">이번 주 표어</h2>
            <p className="mt-2 text-sm leading-6 text-foreground/70">
              &ldquo;매일, 매사에 겸손히 하나님과 동행하자!&rdquo; (미가 6:8)
            </p>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="font-serif text-xl font-semibold text-foreground">교회 소개</h2>
          <p className="mt-3 leading-7 text-foreground/70">
            길가는교회는 대한예수교장로회(통합) 부천노회 소속 교회로, &ldquo;우리가 하나님의
            정원이다&rdquo;라는 마음으로 삶의 현장에서 예수님을 따르며 섬김과 나눔의 길을 함께
            걸어가는 공동체입니다.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/about"
              className="inline-block rounded-full bg-brand px-4 py-2 text-sm text-white transition-colors hover:bg-brand-dark"
            >
              교회소개 자세히 보기 →
            </Link>
            <Link
              href="/bulletin"
              className="inline-block rounded-full border border-black/10 px-4 py-2 text-sm text-foreground/70 transition-colors hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
            >
              이번 주 주보 보기 →
            </Link>
          </div>
        </section>

        <section className="mt-12 border-t border-black/10 pt-8 text-center dark:border-white/10">
          <p className="text-sm text-foreground/50">바로가기</p>
          <div className="mt-4 flex justify-center gap-6">
            <a
              href="https://www.youtube.com/@%EA%B8%B8%EA%B0%80%EB%8A%94%EA%B5%90%ED%9A%8C"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="길가는교회 유튜브"
              className="flex flex-col items-center gap-1 text-foreground/60 transition-colors hover:text-brand-dark"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-black/10 dark:border-white/10">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
                  <path d="M21.6 7.2c-.2-1.3-1.2-2.3-2.5-2.5C17 4.3 12 4.3 12 4.3s-5 0-7.1.4c-1.3.2-2.3 1.2-2.5 2.5C2 9.3 2 12 2 12s0 2.7.4 4.8c.2 1.3 1.2 2.3 2.5 2.5 2.1.4 7.1.4 7.1.4s5 0 7.1-.4c1.3-.2 2.3-1.2 2.5-2.5.4-2.1.4-4.8.4-4.8s0-2.7-.4-4.8ZM10 15.5v-7l6 3.5-6 3.5Z" />
                </svg>
              </span>
              <span className="text-xs">유튜브</span>
            </a>
            <a
              href="https://www.instagram.com/ggn_youth_/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="길가는교회 청년부 인스타그램"
              className="flex flex-col items-center gap-1 text-foreground/60 transition-colors hover:text-brand-dark"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-black/10 dark:border-white/10">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
                </svg>
              </span>
              <span className="text-xs">청년부 인스타그램</span>
            </a>
            <a
              href="https://cafe.daum.net/ggnkids"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="길가는교회 영유아부 다음카페"
              className="flex flex-col items-center gap-1 text-foreground/60 transition-colors hover:text-brand-dark"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-black/10 dark:border-white/10">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M4 5h13a3 3 0 0 1 3 3v3a3 3 0 0 1-3 3H8l-4 4V5Z" />
                </svg>
              </span>
              <span className="text-xs">영유아부 다음카페</span>
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
