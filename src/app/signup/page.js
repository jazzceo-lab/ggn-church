"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { DISTRICT_NAMES, DEPARTMENT_GROUPS } from "@/lib/teamRoster";
import { MIN_PASSWORD_LENGTH } from "@/lib/passwordPolicy";
import PasswordStrengthMeter from "@/components/PasswordStrengthMeter";
import PasswordInput from "@/components/PasswordInput";
import { phoneDigits, phoneToEmail } from "@/lib/loginId";

const DISTRICT_OPTIONS = [...DISTRICT_NAMES, ...DEPARTMENT_GROUPS];

// "010-" 뒤에 이어지는 8자리만 입력받아 1234-5678 형태로 다듬는다.
function formatPhoneRest(raw) {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 4) return digits;
  return `${digits.slice(0, 4)}-${digits.slice(4)}`;
}

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [groupTab, setGroupTab] = useState(null);
  const [district, setDistrict] = useState("");
  const [phoneRest, setPhoneRest] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nameMatches, setNameMatches] = useState([]);

  // 같은 이름의 기존 회원이 있으면 알려준다 (실수로 중복 가입하는 걸 줄이기 위함).
  // 입력할 때마다 매번 요청하지 않도록 타이핑이 잠깐 멈췄을 때만 확인한다.
  useEffect(() => {
    const name = displayName.trim();
    if (!name) {
      setNameMatches([]);
      return;
    }
    const timer = setTimeout(() => {
      fetch("/api/check-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: name }),
      })
        .then((res) => res.json())
        .then((data) => setNameMatches(data.matches ?? []))
        .catch(() => setNameMatches([]));
    }, 500);
    return () => clearTimeout(timer);
  }, [displayName]);

  function selectPastor() {
    setGroupTab("pastor");
    setDistrict("목회자");
  }

  function selectDistrictTab() {
    setGroupTab("district");
    if (district === "목회자") setDistrict("");
  }

  function selectUnknown() {
    setGroupTab("unknown");
    setDistrict("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (phoneDigits(phoneRest).length !== 8) {
      setLoading(false);
      setError("휴대폰 번호 8자리를 모두 입력해주세요.");
      return;
    }
    const fullPhone = `010-${phoneRest}`;
    const trimmedEmail = email.trim();

    // 이메일은 선택. 안 적으면 휴대폰 번호가 로그인 아이디가 된다(loginId.js 참고).
    const { error } = await supabase.auth.signUp({
      email: trimmedEmail || phoneToEmail(fullPhone),
      password,
      options: { data: { display_name: displayName, district: district || null, phone: fullPhone } },
    });

    setLoading(false);
    if (error) {
      if (/already registered|already exists/i.test(error.message)) {
        setError(
          trimmedEmail
            ? "이미 가입된 이메일이에요. 로그인하시거나 비밀번호 찾기를 이용해주세요."
            : "이 휴대폰 번호로 이미 가입된 계정이 있어요. 가족이 같은 번호를 쓰신다면 이메일을 함께 입력해서 가입해주세요."
        );
        return;
      }
      setError("회원가입에 실패했어요: " + error.message);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-12 text-center">
        <h1 className="font-serif text-xl font-bold text-foreground">가입 신청이 완료됐어요</h1>
        <p className="mt-3 text-sm text-foreground/50">
          관리자가 확인 후 승인하면 이용하실 수 있어요. 로그인은{" "}
          {email.trim() ? "이메일" : "휴대폰 번호"}와 비밀번호로 하시면 돼요.
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
          {nameMatches.length > 0 && (
            <p className="mt-1.5 rounded-md bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
              이미 같은 이름의 회원이 있어요 ({nameMatches.join(", ")}). 혹시 본인이시라면 새로 가입하지
              마시고{" "}
              <Link href="/login" className="underline">
                로그인
              </Link>
              하거나{" "}
              <Link href="/forgot-password" className="underline">
                비밀번호 찾기
              </Link>
              를 이용해주세요. 동명이인이시라면 그대로 가입하셔도 괜찮아요.
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/80">소속 구분</label>
          <div className="mt-1 flex gap-2">
            <button
              type="button"
              onClick={selectPastor}
              className={`flex-1 rounded-full border px-3 py-2 text-sm transition-colors ${
                groupTab === "pastor"
                  ? "border-brand bg-brand text-white"
                  : "border-black/10 text-foreground/70 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
              }`}
            >
              목회자
            </button>
            <button
              type="button"
              onClick={selectDistrictTab}
              className={`flex-1 rounded-full border px-3 py-2 text-sm transition-colors ${
                groupTab === "district"
                  ? "border-brand bg-brand text-white"
                  : "border-black/10 text-foreground/70 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
              }`}
            >
              구역
            </button>
            <button
              type="button"
              onClick={selectUnknown}
              className={`flex-1 rounded-full border px-3 py-2 text-sm transition-colors ${
                groupTab === "unknown"
                  ? "border-brand bg-brand text-white"
                  : "border-black/10 text-foreground/70 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
              }`}
            >
              선택 안함
            </button>
          </div>

          {groupTab === "district" && (
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              {DISTRICT_OPTIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDistrict(d)}
                  className={`rounded-md border px-1 py-1.5 text-xs transition-colors ${
                    district === d
                      ? "border-brand bg-brand-tint text-brand-dark"
                      : "border-black/10 text-foreground/70 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/80">휴대폰 번호</label>
          <p className="mt-0.5 text-xs text-foreground/50">
            로그인할 때 사용해요. 번호는 다른 회원에게 보이지 않아요.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-sm text-foreground/60">010-</span>
            <input
              type="text"
              inputMode="numeric"
              required
              maxLength="9"
              value={phoneRest}
              onChange={(e) => setPhoneRest(formatPhoneRest(e.target.value))}
              placeholder="0000-0000"
              className="flex-1 rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/80">이메일 (선택)</label>
          <p className="mt-0.5 text-xs text-foreground/50">
            적어두시면 비밀번호를 잊었을 때 메일로 다시 설정할 수 있어요.
          </p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-1 w-full rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/80">비밀번호</label>
          <PasswordInput
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
