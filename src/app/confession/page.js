"use client";

import Image from "next/image";
import Link from "next/link";

const STANZAS = [
  ["나는", "전능하신 아버지 하나님,", "천지의 창조주를 믿습니다."],
  ["나는", "그의 유일하신 아들,", "우리 주 예수 그리스도를 믿습니다."],
  [
    "그는",
    "성령으로 잉태되어",
    "동정녀 마리아에게서 나시고,",
    "본디오 빌라도에게 고난을 받아",
    "십자가에 못 박혀 죽으시고,",
    "장사된 지 사흘 만에",
    "죽은 자 가운데서 다시 살아나셨으며,",
    "하늘에 오르시어",
    "전능하신 아버지 하나님 우편에 앉아 계시다가,",
    "거기로부터 살아있는 자와 죽은 자를",
    "심판하러 오십니다.",
  ],
  ["나는", "성령을 믿으며,", "거룩한 공교회와 성도의 교제와", "죄를 용서 받는 것과", "몸의 부활과 영생을 믿습니다."],
];

export default function ConfessionPage() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="border-b border-black/5 bg-background px-4 py-2 dark:border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              src="/images/logo-mark.jpg"
              alt="길가는교회 로고"
              width={32}
              height={32}
              className="rounded-full ring-1 ring-black/5"
            />
            <span className="font-serif text-lg font-bold tracking-tight text-foreground">
              길가는교회
            </span>
          </div>
          <Link
            href="/bulletin"
            className="whitespace-nowrap rounded-full border border-black/10 px-3 py-1 text-sm text-foreground/80 transition-colors hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
          >
            ← 되돌아가기
          </Link>
        </div>
        <p className="mt-1 text-sm font-medium text-foreground">새번역 · 사도신경</p>
      </div>

      <div className="flex-1 overflow-auto px-6 pt-2 pb-6">
        <div className="mx-auto max-w-lg space-y-2.5 text-base leading-6 text-foreground/90">
          {STANZAS.map((stanza, i) => (
            <div key={i} className="space-y-0.5">
              {stanza.map((line, j) => (
                <p key={j}>{line}</p>
              ))}
            </div>
          ))}
          <p className="pt-1 font-semibold text-brand-dark">아멘</p>
        </div>
      </div>
    </div>
  );
}
