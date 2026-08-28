"use client";

import { useState } from "react";

const accounts = [
  { key: "general", title: "일반헌금", bank: "농협", number: "141-01-317160" },
  { key: "building", title: "건축헌금", bank: "농협", number: "301-0141-2913-81" },
];

// 안드로이드는 패키지명으로 앱의 실행(MAIN/LAUNCHER) 액티비티를 직접 열기 때문에
// 은행별 커스텀 스킴을 몰라도 설치되어 있으면 바로 열림. iOS는 커스텀 스킴 방식만
// 있어서(공식 문서가 없어 커뮤니티에 알려진 값 사용) 은행이 스킴을 바꾸면 iOS에서만
// 안 열릴 수 있음.
// 하나은행은 앱 후보가 여러 개라(하나원큐 등) 패키지를 특정하지 않고 검색 결과로 이동.
const BANK_APPS = [
  { key: "nh", label: "농협", scheme: "com.nonghyup.nhsmartbanking", androidPackage: "nh.smart.banking" },
  { key: "kb", label: "국민은행", scheme: "kBbank", androidPackage: "com.kbstar.kbbank" },
  { key: "shinhan", label: "신한은행", scheme: "shinhanSol", androidPackage: "com.shinhan.sbanking" },
  { key: "woori", label: "우리은행", scheme: "wooribank", androidPackage: "com.wooribank.smart.npib" },
  {
    key: "hana",
    label: "하나은행",
    directUrl: "https://play.google.com/store/search?q=%ED%95%98%EB%82%98%EC%9D%80%ED%96%89&c=apps&hl=ko",
  },
  { key: "kakao", label: "카카오뱅크", scheme: "kakaobank", androidPackage: "com.kakaobank.channel" },
];

export default function DonatePage() {
  const [copiedKey, setCopiedKey] = useState("");

  async function handleCopy(account) {
    try {
      await navigator.clipboard.writeText(account.number.replace(/-/g, ""));
      setCopiedKey(account.key);
      setTimeout(() => setCopiedKey(""), 2000);
    } catch {
      // clipboard API unavailable, ignore
    }
  }

  function handleOpenBankApp(bank) {
    if (bank.directUrl) {
      window.location.assign(bank.directUrl);
      return;
    }
    const isAndroid = /android/i.test(navigator.userAgent);
    let target = `${bank.scheme}://`;
    if (isAndroid) {
      const fallback = encodeURIComponent(
        `https://play.google.com/store/apps/details?id=${bank.androidPackage}`
      );
      target = `intent://#Intent;package=${bank.androidPackage};action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;S.browser_fallback_url=${fallback};end`;
    }
    window.location.assign(target);
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-4 pb-12">
      <h1 className="font-serif text-2xl font-bold text-foreground">헌금 안내</h1>
      <p className="mt-2 text-sm text-foreground/50">
        아래 계좌로 헌금해주시면 됩니다. 계좌번호를 눌러서 복사한 뒤, 사용하시는 은행 앱에서
        송금해주세요.
      </p>

      <div className="mt-6 space-y-4">
        {accounts.map((account) => (
          <div
            key={account.key}
            className="rounded-xl border border-black/10 bg-white/60 p-5 dark:border-white/10 dark:bg-white/5"
          >
            <h2 className="font-serif font-semibold text-foreground">{account.title}</h2>
            <button
              onClick={() => handleCopy(account)}
              className="mt-2 flex w-full items-center justify-between rounded-md border border-black/10 px-3 py-2 text-left text-sm transition-colors hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
            >
              <span className="text-foreground/80">
                {account.bank} {account.number}
              </span>
              <span className="text-xs text-brand-dark">
                {copiedKey === account.key ? "복사됨!" : "복사"}
              </span>
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <p className="text-center text-xs font-medium text-foreground/60">은행 앱 바로가기</p>
        <div className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-3">
          {BANK_APPS.map((bank) => (
            <button
              key={bank.key}
              onClick={() => handleOpenBankApp(bank)}
              className="flex w-16 flex-col items-center gap-1 text-foreground/60 transition-colors hover:text-brand-dark"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-black/10 text-2xl dark:border-white/10">
                🏦
              </span>
              <span className="text-center text-xs leading-tight">{bank.label}</span>
            </button>
          ))}
        </div>
        <p className="mt-2 text-center text-[11px] text-foreground/40">
          앱이 설치되어 있어야 열려요. (안드로이드는 미설치 시 스토어로 이동해요)
        </p>
      </div>

      <p className="mt-6 text-xs text-foreground/40">
        예금주는 &ldquo;길가는교회&rdquo;입니다. 헌금 관련 문의는 교회 사무실(032-321-9182)로
        연락해주세요.
      </p>
    </main>
  );
}
