"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { MIN_PASSWORD_LENGTH } from "@/lib/passwordPolicy";
import PasswordStrengthMeter from "@/components/PasswordStrengthMeter";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);
    if (error) {
      setError("변경에 실패했어요: " + error.message);
      return;
    }
    setDone(true);
    setTimeout(() => {
      router.push("/login");
    }, 1500);
  }

  if (done) {
    return (
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-12 text-center">
        <h1 className="font-serif text-xl font-bold text-foreground">비밀번호가 변경됐어요</h1>
        <p className="mt-3 text-sm text-foreground/60">잠시 후 로그인 화면으로 이동합니다.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-12">
      <h1 className="font-serif text-2xl font-bold text-foreground">새 비밀번호 설정</h1>
      <p className="mt-2 text-sm text-foreground/50">새로 사용할 비밀번호를 입력해주세요.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground/80">새 비밀번호</label>
          <input
            type="password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={`${MIN_PASSWORD_LENGTH}자 이상`}
            className="mt-1 w-full rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
          />
          <PasswordStrengthMeter password={password} />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-brand py-2 text-sm text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
        >
          {loading ? "변경 중..." : "비밀번호 변경"}
        </button>
      </form>
    </main>
  );
}
