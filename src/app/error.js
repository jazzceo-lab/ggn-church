"use client";

import Image from "next/image";
import Link from "next/link";

export default function ErrorPage({ reset }) {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center px-4 py-12 text-center">
      <Image
        src="/images/logo-mark.jpg"
        alt="길가는교회 로고"
        width={64}
        height={64}
        className="rounded-full ring-1 ring-black/5"
      />
      <h1 className="mt-6 font-serif text-2xl font-bold text-foreground">
        문제가 발생했어요
      </h1>
      <p className="mt-3 break-keep text-sm text-foreground/60">
        일시적인 오류예요. 다시 시도하거나 홈으로 돌아가 주세요.
      </p>
      <div className="mt-6 flex gap-2">
        <button
          onClick={() => reset()}
          className="rounded-full border border-black/10 px-4 py-2 text-sm text-foreground/70 transition-colors hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
        >
          다시 시도
        </button>
        <Link
          href="/"
          className="rounded-full bg-brand px-4 py-2 text-sm text-white transition-colors hover:bg-brand-dark"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </main>
  );
}
