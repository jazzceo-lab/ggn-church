"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (error) {
      setError("로그인에 실패했어요: " + error.message);
      return;
    }
    router.push("/");
    router.refresh();
  }

  async function handleKakaoLogin() {
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: { redirectTo: `${window.location.origin}/` },
    });
    if (error) {
      setError("카카오 로그인에 실패했어요: " + error.message);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-12">
      <h1 className="font-serif text-2xl font-bold text-foreground">로그인</h1>

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
        <div>
          <label className="block text-sm font-medium text-foreground/80">비밀번호</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="mt-1 w-full rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <p className="text-right text-sm">
          <Link href="/forgot-password" className="text-foreground/50 underline">
            비밀번호를 잊으셨나요?
          </Link>
        </p>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-brand py-2 text-sm text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
        >
          {loading ? "로그인 중..." : "로그인"}
        </button>
      </form>

      <div className="mt-6 flex items-center gap-3 text-xs text-foreground/40">
        <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
        또는
        <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
      </div>

      <button
        type="button"
        onClick={handleKakaoLogin}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#FEE500] py-2 text-sm font-medium text-black/85 transition-opacity hover:opacity-90"
      >
        💬 카카오로 로그인
      </button>

      <p className="mt-4 text-center text-sm text-foreground/50">
        계정이 없으신가요?{" "}
        <Link href="/signup" className="font-medium text-brand-dark underline">
          회원가입
        </Link>
      </p>
    </main>
  );
}
