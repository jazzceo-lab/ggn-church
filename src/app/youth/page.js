"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { canViewYouth } from "@/lib/youth";

const MENUS = [
  { href: "/youth/bulletin", icon: "📖", title: "주보", description: "매주 청년부 예배 주보" },
  { href: "/board?youth=1", icon: "💬", title: "게시판", description: "청년부만 보는 게시판" },
  { href: "/youth/forms", icon: "📝", title: "신청·설문", description: "행사 신청과 설문 응답" },
];

export default function YouthPage() {
  const auth = useAuth();

  if (!auth.loading && (!auth.user || !canViewYouth(auth))) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 text-center">
        <h1 className="font-serif text-2xl font-bold text-foreground">청년부</h1>
        <p className="mt-3 text-sm text-foreground/60">청년부 회원만 볼 수 있는 메뉴예요.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-3 pb-12">
      <h1 className="font-serif text-2xl font-bold text-foreground">청년부</h1>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {MENUS.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className="rounded-xl border border-black/10 bg-white/60 p-5 transition-colors hover:border-brand hover:bg-brand-tint/40 dark:border-white/10 dark:bg-white/5"
          >
            <p className="text-2xl">{m.icon}</p>
            <p className="mt-2 font-medium text-foreground">{m.title}</p>
            <p className="mt-1 text-xs text-foreground/50">{m.description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
