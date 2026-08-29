"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabaseClient";

const STATUS_LABELS = {
  waiting: "대기",
  in_progress: "처리중",
  done: "발급완료",
};

const STATUS_CLASSES = {
  waiting: "bg-black/5 text-foreground/60 dark:bg-white/10",
  in_progress: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  done: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
};

export default function AdminReceiptsPage() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(true);
  const [toggling, setToggling] = useState(false);

  async function loadRequests() {
    setLoading(true);
    const { data } = await supabase
      .from("receipt_requests")
      .select("id, name, birth_date, phone, year_label, status, created_at")
      .order("created_at", { ascending: false });
    setRequests(data ?? []);
    setLoading(false);
  }

  async function loadSetting() {
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "receipt_requests_open")
      .maybeSingle();
    setIsOpen(data?.value ?? true);
  }

  useEffect(() => {
    if (isAdmin) {
      loadRequests();
      loadSetting();
    }
  }, [isAdmin]);

  async function toggleOpen() {
    setToggling(true);
    const { error } = await supabase
      .from("app_settings")
      .update({ value: !isOpen })
      .eq("key", "receipt_requests_open");
    setToggling(false);
    if (error) {
      window.alert("설정 변경에 실패했어요: " + error.message);
      return;
    }
    setIsOpen((v) => !v);
  }

  async function updateStatus(id, status) {
    const { error } = await supabase.from("receipt_requests").update({ status }).eq("id", id);
    if (error) {
      window.alert("상태 변경에 실패했어요: " + error.message);
      return;
    }
    loadRequests();
  }

  if (!authLoading && !isAdmin) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 text-center">
        <h1 className="font-serif text-2xl font-bold text-foreground">기부금영수증 신청 목록</h1>
        <p className="mt-3 text-sm text-foreground/60">관리자만 볼 수 있는 페이지예요.</p>
        {!user && (
          <Link href="/login" className="mt-6 inline-block text-brand-dark underline">
            로그인하러 가기
          </Link>
        )}
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
      <h1 className="font-serif text-2xl font-bold text-foreground">기부금영수증 신청 목록</h1>
      <p className="mt-2 text-sm text-foreground/50">교인들이 신청한 기부금영수증 내역이에요.</p>

      <div className="mt-6 flex items-center justify-between rounded-xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
        <div>
          <p className="text-sm font-medium text-foreground">신청 기간</p>
          <p className="mt-0.5 text-xs text-foreground/50">
            {isOpen
              ? "지금 신청을 받고 있어요."
              : "회원 화면에 \"지금은 신청기간이 아닙니다\"라고 표시돼요."}
          </p>
        </div>
        <button
          onClick={toggleOpen}
          disabled={toggling}
          aria-pressed={isOpen}
          aria-label="신청 기간 켜기/끄기"
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
            isOpen ? "bg-brand" : "bg-black/20 dark:bg-white/20"
          }`}
        >
          <span
            className={`absolute top-0.5 h-6 w-6 rounded-full bg-white transition-transform ${
              isOpen ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      <ul className="mt-6 divide-y divide-black/10 rounded-xl border border-black/10 bg-white/60 dark:divide-white/10 dark:border-white/10 dark:bg-white/5">
        {loading && <li className="p-4 text-sm text-foreground/50">불러오는 중...</li>}
        {!loading && requests.length === 0 && (
          <li className="p-4 text-sm text-foreground/50">신청 내역이 없어요.</li>
        )}
        {requests.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="font-medium text-foreground">
                {r.name}
                <span
                  className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[r.status]}`}
                >
                  {STATUS_LABELS[r.status]}
                </span>
              </p>
              <p className="mt-1 text-xs text-foreground/50">
                {r.year_label} · 생년월일 {r.birth_date} · {r.phone}
              </p>
              <p className="mt-0.5 text-xs text-foreground/30">
                {new Date(r.created_at).toLocaleString("ko-KR")}
              </p>
            </div>
            <select
              value={r.status}
              onChange={(e) => updateStatus(r.id, e.target.value)}
              className="rounded-md border border-black/10 px-2 py-1 text-xs dark:border-white/10 dark:bg-white/10"
            >
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </li>
        ))}
      </ul>
    </main>
  );
}
