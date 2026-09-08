"use client";

import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ChurchInfoPage() {
  const { loading: authLoading, isAdmin, churchId } = useAuth();
  const [formData, setFormData] = useState({
    churchName: "",
    address: "",
    phoneNumber: "",
    email: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!churchId) return;
    loadChurchInfo();
  }, [churchId]);

  async function loadChurchInfo() {
    const { data } = await supabase
      .from("church_info")
      .select("*")
      .eq("church_id", churchId)
      .single();

    if (data) {
      setFormData({
        churchName: data.church_name || "",
        address: data.address || "",
        phoneNumber: data.phone_number || "",
        email: data.email || "",
        description: data.description || "",
      });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const { error } = await supabase
        .from("church_info")
        .upsert({
          church_id: churchId,
          church_name: formData.churchName,
          address: formData.address,
          phone_number: formData.phoneNumber,
          email: formData.email,
          description: formData.description,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      setMessage("저장되었습니다.");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage(`오류: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

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
        <h1 className="font-serif text-2xl font-bold text-foreground">교회 기본정보</h1>
        <p className="mt-2 text-sm text-foreground/50">교회의 로고, 사진, 주소, 전화번호 등을 관리하세요.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-black/10 bg-white/60 p-6 dark:border-white/10 dark:bg-white/5">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground">교회명</label>
              <input
                type="text"
                name="churchName"
                value={formData.churchName}
                onChange={handleChange}
                placeholder="교회 이름을 입력하세요"
                className="mt-1 w-full rounded-lg border border-black/10 bg-white/50 px-3 py-2 text-sm text-foreground placeholder-foreground/40 dark:border-white/10 dark:bg-white/5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground">주소</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="교회 주소를 입력하세요"
                className="mt-1 w-full rounded-lg border border-black/10 bg-white/50 px-3 py-2 text-sm text-foreground placeholder-foreground/40 dark:border-white/10 dark:bg-white/5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground">전화번호</label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="예: 02-1234-5678"
                className="mt-1 w-full rounded-lg border border-black/10 bg-white/50 px-3 py-2 text-sm text-foreground placeholder-foreground/40 dark:border-white/10 dark:bg-white/5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground">이메일</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="교회 이메일을 입력하세요"
                className="mt-1 w-full rounded-lg border border-black/10 bg-white/50 px-3 py-2 text-sm text-foreground placeholder-foreground/40 dark:border-white/10 dark:bg-white/5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground">설명</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="교회에 대한 간단한 설명을 입력하세요"
                rows={4}
                className="mt-1 w-full rounded-lg border border-black/10 bg-white/50 px-3 py-2 text-sm text-foreground placeholder-foreground/40 dark:border-white/10 dark:bg-white/5"
              />
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
            >
              {loading ? "저장 중..." : "저장하기"}
            </button>
            <Link href="/admin" className="rounded-lg border border-black/10 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5">
              돌아가기
            </Link>
          </div>

          {message && (
            <p className={`mt-4 text-sm ${message.startsWith("오류") ? "text-red-600" : "text-green-600"}`}>
              {message}
            </p>
          )}
        </div>
      </form>
    </main>
  );
}
