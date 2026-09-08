"use client";

import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";

export default function AppSettingsPage() {
  const { loading: authLoading, isAdmin } = useAuth();

  if (!authLoading && !isAdmin) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 text-center">
        <h1 className="font-serif text-2xl font-bold text-foreground">관리자 전용</h1>
        <p className="mt-3 text-sm text-foreground/60">관리자만 볼 수 있는 페이지예요.</p>
        <Link href="/admin" className="mt-6 inline-block text-brand-dark underline">
          관리자 대시보드로 돌아가기
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-3 pb-12">
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-bold text-foreground">앱 설정</h1>
        <p className="mt-2 text-sm text-foreground/50">예배시간표, 부서명 등 앱의 기본 설정을 관리하세요.</p>
      </div>

      <div className="rounded-xl border border-black/10 bg-white/60 p-6 dark:border-white/10 dark:bg-white/5">
        <p className="text-sm text-foreground/60">준비 중입니다. 곧 이 기능을 추가하겠습니다.</p>
      </div>
    </main>
  );
}
