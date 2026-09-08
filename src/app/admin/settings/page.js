"use client";

import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AppSettingsPage() {
  const { loading: authLoading, isAdmin, churchId } = useAuth();
  const [formData, setFormData] = useState({
    departments: "",
    sundayServiceTime: "",
    wednesdayServiceTime: "",
    sundayServiceName: "",
    additionalSettings: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!churchId) return;
    loadSettings();
  }, [churchId]);

  async function loadSettings() {
    const { data } = await supabase
      .from("app_settings")
      .select("*")
      .eq("church_id", churchId)
      .single();

    if (data) {
      setFormData({
        departments: data.departments || "",
        sundayServiceTime: data.sunday_service_time || "",
        wednesdayServiceTime: data.wednesday_service_time || "",
        sundayServiceName: data.sunday_service_name || "",
        additionalSettings: data.additional_settings || "",
      });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const { error } = await supabase
        .from("app_settings")
        .upsert({
          church_id: churchId,
          departments: formData.departments,
          sunday_service_time: formData.sundayServiceTime,
          wednesday_service_time: formData.wednesdayServiceTime,
          sunday_service_name: formData.sundayServiceName,
          additional_settings: formData.additionalSettings,
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
        <h1 className="font-serif text-2xl font-bold text-foreground">앱 설정</h1>
        <p className="mt-2 text-sm text-foreground/50">예배시간표, 부서명 등 앱의 기본 설정을 관리하세요.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-black/10 bg-white/60 p-6 dark:border-white/10 dark:bg-white/5">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground">부서명 (쉼표로 구분)</label>
              <input
                type="text"
                name="departments"
                value={formData.departments}
                onChange={handleChange}
                placeholder="예: 목사, 전도사, 찬양팀, 아동부"
                className="mt-1 w-full rounded-lg border border-black/10 bg-white/50 px-3 py-2 text-sm text-foreground placeholder-foreground/40 dark:border-white/10 dark:bg-white/5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground">주일 예배 시간</label>
              <input
                type="text"
                name="sundayServiceTime"
                value={formData.sundayServiceTime}
                onChange={handleChange}
                placeholder="예: 오전 10:30"
                className="mt-1 w-full rounded-lg border border-black/10 bg-white/50 px-3 py-2 text-sm text-foreground placeholder-foreground/40 dark:border-white/10 dark:bg-white/5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground">수요일 예배 시간</label>
              <input
                type="text"
                name="wednesdayServiceTime"
                value={formData.wednesdayServiceTime}
                onChange={handleChange}
                placeholder="예: 오후 7:30"
                className="mt-1 w-full rounded-lg border border-black/10 bg-white/50 px-3 py-2 text-sm text-foreground placeholder-foreground/40 dark:border-white/10 dark:bg-white/5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground">주일 예배명</label>
              <input
                type="text"
                name="sundayServiceName"
                value={formData.sundayServiceName}
                onChange={handleChange}
                placeholder="예: 주일 낮 예배"
                className="mt-1 w-full rounded-lg border border-black/10 bg-white/50 px-3 py-2 text-sm text-foreground placeholder-foreground/40 dark:border-white/10 dark:bg-white/5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground">기타 설정</label>
              <textarea
                name="additionalSettings"
                value={formData.additionalSettings}
                onChange={handleChange}
                placeholder="추가할 설정이 있으면 입력하세요"
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
