"use client";

import { useState } from "react";

const accounts = [
  { key: "general", title: "일반헌금", bank: "농협", number: "141-01-317160" },
  { key: "building", title: "건축헌금", bank: "농협", number: "301-0141-2913-81" },
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

      <p className="mt-6 text-xs text-foreground/40">
        예금주는 &ldquo;길가는교회&rdquo;입니다. 헌금 관련 문의는 교회 사무실(032-321-9182)로
        연락해주세요.
      </p>
    </main>
  );
}
