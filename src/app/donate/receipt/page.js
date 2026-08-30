"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabaseClient";

const YEAR_OPTIONS = ["2026년 귀속분", "2025년 귀속분"];

export default function DonationReceiptPage() {
  const { user, loading: authLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(true);
  const [settingLoading, setSettingLoading] = useState(true);
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
  const [yearLabel, setYearLabel] = useState(YEAR_OPTIONS[0]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    supabase
      .from("app_settings")
      .select("value")
      .eq("key", "receipt_requests_open")
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) console.error("신청 기간 설정 조회 실패:", error.message);
        setIsOpen(data?.value ?? true);
        setSettingLoading(false);
      });
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError("");

    const errors = {};
    if (!name.trim()) errors.name = "성명을 입력해주세요.";
    if (!/^\d{6}$/.test(birthDate.trim())) errors.birthDate = "생년월일 6자리를 입력해주세요.";
    if (!phone.trim()) errors.phone = "연락처를 입력해주세요.";
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    const { error } = await supabase.from("receipt_requests").insert({
      user_id: user.id,
      name: name.trim(),
      birth_date: birthDate.trim(),
      phone: phone.trim(),
      year_label: yearLabel,
    });
    setSubmitting(false);

    if (error) {
      setSubmitError("신청에 실패했어요: " + error.message);
      return;
    }
    setDone(true);
  }

  if (!authLoading && !user) {
    return (
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-12 text-center">
        <h1 className="font-serif text-2xl font-bold text-foreground">기부금영수증 신청</h1>
        <p className="mt-3 text-sm text-foreground/60">
          신청하려면{" "}
          <Link href="/login" className="text-brand-dark underline">
            로그인
          </Link>
          이 필요해요.
        </p>
      </main>
    );
  }

  if (!settingLoading && !isOpen) {
    return (
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-12 text-center">
        <h1 className="font-serif text-2xl font-bold text-foreground">기부금영수증 신청</h1>
        <p className="mt-3 text-sm text-foreground/60">지금은 신청기간이 아닙니다.</p>
        <Link
          href="/donate"
          className="mt-6 inline-block rounded-full bg-brand px-4 py-2 text-sm text-white transition-colors hover:bg-brand-dark"
        >
          헌금안내로 돌아가기
        </Link>
      </main>
    );
  }

  if (done) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-tint text-2xl text-brand-dark">
          ✓
        </div>
        <h1 className="mt-4 font-serif text-xl font-bold text-foreground">신청이 접수되었어요</h1>
        <p className="mt-2 text-sm text-foreground/60">
          확인 후 담당자가 연락드릴게요.
          <br />
          영수증은 이메일 또는 우편으로 발급돼요.
        </p>
        <Link
          href="/donate"
          className="mt-6 inline-block rounded-full bg-brand px-4 py-2 text-sm text-white transition-colors hover:bg-brand-dark"
        >
          헌금안내로 돌아가기
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 pt-3 pb-12">
      <h1 className="font-serif text-2xl font-bold text-foreground">기부금영수증 신청</h1>
      <p className="mt-2 text-sm text-foreground/50">아래 정보로 신청서를 작성해주세요.</p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-4 rounded-xl border border-black/10 bg-white/60 p-5 dark:border-white/10 dark:bg-white/5"
      >
        <div>
          <label className="block text-sm text-foreground/60">성명 *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="홍길동"
            className="mt-1 w-full rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/10"
          />
          {fieldErrors.name && <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>}
        </div>

        <div>
          <label className="block text-sm text-foreground/60">생년월일 (주민등록번호 앞 6자리) *</label>
          <input
            type="text"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="900101"
            className="mt-1 w-full rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/10"
          />
          {fieldErrors.birthDate && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.birthDate}</p>
          )}
        </div>

        <div>
          <label className="block text-sm text-foreground/60">연락처 *</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="010-1234-5678"
            className="mt-1 w-full rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/10"
          />
          {fieldErrors.phone && <p className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p>}
        </div>

        <div>
          <label className="block text-sm text-foreground/60">신청 연도</label>
          <select
            value={yearLabel}
            onChange={(e) => setYearLabel(e.target.value)}
            className="mt-1 w-full rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/10"
          >
            {YEAR_OPTIONS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <p className="rounded-lg border border-black/10 bg-black/5 p-3 text-xs leading-relaxed text-foreground/60 dark:border-white/10 dark:bg-white/10">
          🔒 입력하신 정보는 관리자만 확인할 수 있어요. 주민등록번호 뒤 7자리 등 추가 확인이
          필요하면 담당자가 따로 연락드려요.
        </p>

        {submitError && <p className="text-sm text-red-600">{submitError}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-brand py-2 text-sm text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
        >
          {submitting ? "신청 중..." : "신청하기"}
        </button>
      </form>
    </main>
  );
}
