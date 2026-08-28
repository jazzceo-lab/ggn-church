"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { GYODOKMUN } from "@/lib/gyodokmun";

export default function GyodokmunPage() {
  const [number, setNumber] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const num = parseInt(params.get("open"), 10);
    if (num && GYODOKMUN[num]) setNumber(num);
  }, []);

  const entry = number ? GYODOKMUN[number] : null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="border-b border-black/5 bg-background px-4 py-3 dark:border-white/10">
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
        {entry && (
          <p className="mt-2 text-sm font-medium text-foreground">
            교독문 {number}번 · {entry.title}
          </p>
        )}
      </div>

      <div className="flex-1 overflow-auto px-6 py-6">
        {!entry ? (
          <p className="text-sm text-foreground/50">교독문을 찾을 수 없어요.</p>
        ) : (
          <div className="mx-auto max-w-lg space-y-3 text-lg leading-8 text-foreground/90">
            {entry.lines.map((line, i) => (
              <p key={i} className={line.startsWith("(다같이)") ? "font-semibold text-brand-dark" : ""}>
                {line}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
