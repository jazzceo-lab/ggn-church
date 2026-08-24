"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { DISTRICT_NAMES } from "@/lib/teamRoster";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [district, setDistrict] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName, district: district || null } },
    });

    setLoading(false);
    if (error) {
      setError("회원가입에 실패했어요: " + error.message);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-12 text-center">
        <h1 className="font-serif text-xl font-bold text-foreground">가입 확인 메일을 보냈어요</h1>
        <p className="mt-3 text-sm text-foreground/50">
          입력하신 이메일함을 확인해서 인증 링크를 눌러주세요. 인증 후 로그인하실 수 있어요.
        </p>
        <Link href="/login" className="mt-6 font-medium text-brand-dark underline">
          로그인 화면으로
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-12">
      <h1 className="font-serif text-2xl font-bold text-foreground">회원가입</h1>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground/80">이름</label>
          <input
            type="text"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="홍길동"
            className="mt-1 w-full rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/80">소속 구역</label>
          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="mt-1 w-full rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
          >
            <option value="">선택 안 함 / 잘 모르겠어요</option>
            {DISTRICT_NAMES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
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
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="6자 이상"
            className="mt-1 w-full rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-brand py-2 text-sm text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
        >
          {loading ? "가입 중..." : "가입하기"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-foreground/50">
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className="font-medium text-brand-dark underline">
          로그인
        </Link>
      </p>
    </main>
  );
}
