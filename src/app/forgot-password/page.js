"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);
    if (error) {
      setError("요청에 실패했어요: " + error.message);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-12 text-center">
        <h1 className="font-serif text-xl font-bold text-foreground">이메일을 보냈어요</h1>
        <p className="mt-3 text-sm text-foreground/60">
          입력하신 이메일함을 확인해서 비밀번호 재설정 링크를 눌러주세요.
        </p>
        <Link href="/login" className="mt-6 font-medium text-brand-dark underline">
          로그인 화면으로
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-12">
      <h1 className="font-serif text-2xl font-bold text-foreground">비밀번호 찾기</h1>
      <p className="mt-2 text-sm text-foreground/50">
        가입하신 이메일 주소를 입력하시면 재설정 링크를 보내드려요.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground/80">이메일</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-1 w-full rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-brand py-2 text-sm text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
        >
          {loading ? "전송 중..." : "재설정 링크 받기"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-foreground/50">
        <Link href="/login" className="font-medium text-brand-dark underline">
          로그인 화면으로 돌아가기
        </Link>
      </p>
    </main>
  );
}
