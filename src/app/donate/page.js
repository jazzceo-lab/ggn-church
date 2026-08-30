"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import DonationThermometer from "@/components/DonationThermometer";

const accounts = [
  { key: "general", title: "일반헌금", bank: "농협", number: "141-01-317160" },
  { key: "building", title: "건축헌금", bank: "농협", number: "301-0141-2913-81" },
];

// 은행 앱의 커스텀 스킴은 공식 문서가 없고, 크롬은 보안 정책상 BROWSABLE로 등록된
// 액티비티만 웹링크로 실행을 허용해서 스킴을 정확히 몰라도 무조건 앱을 열 수는 없음.
// 그래서 구글 플레이스토어의 해당 앱 페이지로 연결 - 이미 설치되어 있으면 "열기"
// 버튼이 보이고, 없으면 설치할 수 있어서 항상 정상적으로 동작함.
// 하나은행은 앱 후보가 여러 개라 특정 앱을 지목하지 않고 검색 결과로 연결.
const BANK_APPS = [
  {
    key: "nh",
    label: "농협",
    short: "NH",
    url: "https://play.google.com/store/apps/details?id=nh.smart.banking&hl=ko",
    bg: "#00a651",
    fg: "#ffffff",
  },
  {
    key: "kb",
    label: "국민은행",
    short: "KB",
    url: "https://play.google.com/store/apps/details?id=com.kbstar.kbbank&hl=ko",
    bg: "#ffbc00",
    fg: "#1b1b3a",
  },
  {
    key: "shinhan",
    label: "신한은행",
    short: "신한",
    url: "https://play.google.com/store/apps/details?id=com.shinhan.sbanking&hl=ko",
    bg: "#0046ff",
    fg: "#ffffff",
  },
  {
    key: "woori",
    label: "우리은행",
    short: "우리",
    url: "https://play.google.com/store/apps/details?id=com.wooribank.smart.npib&hl=ko",
    bg: "#0067ac",
    fg: "#ffffff",
  },
  {
    key: "hana",
    label: "하나은행",
    short: "하나",
    url: "https://play.google.com/store/search?q=%ED%95%98%EB%82%98%EC%9D%80%ED%96%89&c=apps&hl=ko",
    bg: "#009490",
    fg: "#ffffff",
  },
  {
    key: "kakao",
    label: "카카오뱅크",
    short: "카카오",
    url: "https://play.google.com/store/apps/details?id=com.kakaobank.channel&hl=ko",
    bg: "#fee500",
    fg: "#3c1e1e",
  },
];

export default function DonatePage() {
  const { user } = useAuth();
  const [copiedKey, setCopiedKey] = useState("");
  const [receiptOpen, setReceiptOpen] = useState(true);

  useEffect(() => {
    supabase
      .from("app_settings")
      .select("value")
      .eq("key", "receipt_requests_open")
      .maybeSingle()
      .then(({ data }) => {
        setReceiptOpen(data?.value ?? true);
      });
  }, []);

  async function handleCopy(account) {
    try {
      await navigator.clipboard.writeText(account.number.replace(/-/g, ""));
      setCopiedKey(account.key);
      setTimeout(() => setCopiedKey(""), 2000);
    } catch {
      // clipboard API unavailable, ignore
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-3 pb-12">
      <h1 className="font-serif text-2xl font-bold text-foreground">헌금 안내</h1>

      {user && (
        <div className="mt-6 grid grid-cols-2 gap-3">
          <DonationThermometer goalKey="general" />
          <DonationThermometer goalKey="building" />
        </div>
      )}

      <div className="mt-6 space-y-4 rounded-xl border border-black/10 bg-white/60 p-5 dark:border-white/10 dark:bg-white/5">
        {accounts.map((account) => (
          <div key={account.key}>
            <h2 className="font-serif font-semibold text-foreground">{account.title}</h2>
            <button
              onClick={() => handleCopy(account)}
              className="mt-2 flex w-full items-center justify-between rounded-md border border-black/10 px-3 py-2 text-left text-sm transition-colors hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
            >
              <span className="text-foreground/80">
                {account.bank} {account.number}
              </span>
              <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                  copiedKey === account.key
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                    : "bg-brand text-white"
                }`}
              >
                {copiedKey === account.key ? "복사됨!" : "복사"}
              </span>
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-3">
          {BANK_APPS.map((bank) => (
            <a
              key={bank.key}
              href={bank.url}
              className="flex w-16 flex-col items-center gap-1 text-foreground/60 transition-colors hover:text-brand-dark"
            >
              <span
                className="flex h-12 w-12 items-center justify-center rounded-full text-xs font-bold"
                style={{ backgroundColor: bank.bg, color: bank.fg }}
              >
                {bank.short}
              </span>
              <span className="text-center text-xs leading-tight">{bank.label}</span>
            </a>
          ))}
        </div>
        <p className="mt-2 text-center text-[11px] text-foreground/40">
          구글 플레이스토어의 해당 앱 페이지로 이동해요. 이미 설치되어 있으면 거기서
          &ldquo;열기&rdquo;를 눌러주세요.
        </p>
      </div>

      {receiptOpen ? (
        <Link
          href="/donate/receipt"
          className="mt-6 flex items-center gap-3 rounded-xl border border-brand bg-brand-tint p-4 transition-colors hover:brightness-95"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand text-white">
            🧾
          </span>
          <span>
            <span className="block text-sm font-medium text-foreground">기부금영수증 신청</span>
            <span className="block text-xs text-foreground/50">연말정산용 영수증을 신청하세요</span>
          </span>
          <span className="ml-auto text-brand-dark">→</span>
        </Link>
      ) : (
        <div className="mt-6 flex items-center gap-3 rounded-xl border border-black/10 bg-black/5 p-4 dark:border-white/10 dark:bg-white/5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-black/10 text-white/70 dark:bg-white/10">
            🧾
          </span>
          <span>
            <span className="block text-sm font-medium text-foreground/50">기부금영수증 신청</span>
            <span className="block text-xs text-foreground/40">지금은 신청기간이 아닙니다</span>
          </span>
        </div>
      )}

      <p className="mt-6 text-xs text-foreground/40">
        예금주는 &ldquo;길가는교회&rdquo;입니다. 헌금 관련 문의는 교회 사무실(032-321-9182)로
        연락해주세요.
      </p>
    </main>
  );
}
