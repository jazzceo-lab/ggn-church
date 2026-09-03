"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabaseClient";

const GOAL_KEYS = ["general", "building"];

function GoalManager({ goalKey, onChanged }) {
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState(0);
  const [targetInput, setTargetInput] = useState("");
  const [savingTarget, setSavingTarget] = useState(false);
  const [entries, setEntries] = useState([]);
  const [amountInput, setAmountInput] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const { data: goal } = await supabase
      .from("donation_goals")
      .select("title, target_amount")
      .eq("key", goalKey)
      .single();
    setTitle(goal?.title ?? "");
    setTarget(goal?.target_amount ?? 0);
    setTargetInput(String(goal?.target_amount ?? 0));

    const { data: rows } = await supabase
      .from("donation_entries")
      .select("id, amount, note, created_at")
      .eq("goal_key", goalKey)
      .order("created_at", { ascending: false });
    setEntries(rows ?? []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goalKey]);

  const total = entries.reduce((sum, e) => sum + e.amount, 0);

  async function handleSaveTarget() {
    const value = parseInt(targetInput.replace(/[^0-9]/g, ""), 10);
    if (!value) {
      setError("목표 금액을 입력해주세요.");
      return;
    }
    setError("");
    setSavingTarget(true);
    const { error: updateError } = await supabase
      .from("donation_goals")
      .update({ target_amount: value })
      .eq("key", goalKey);
    setSavingTarget(false);
    if (updateError) {
      setError("목표 저장에 실패했어요: " + updateError.message);
      return;
    }
    load();
    onChanged?.();
  }

  async function handleAddEntry() {
    const value = parseInt(amountInput.replace(/[^0-9]/g, ""), 10);
    if (!value) {
      setError("이번 주 헌금액을 입력해주세요.");
      return;
    }
    setError("");
    setAdding(true);
    const { error: insertError } = await supabase
      .from("donation_entries")
      .insert({ goal_key: goalKey, amount: value, note: noteInput.trim() || null });
    setAdding(false);
    if (insertError) {
      setError("입력에 실패했어요: " + insertError.message);
      return;
    }
    setAmountInput("");
    setNoteInput("");
    load();
    onChanged?.();
  }

  async function handleDeleteEntry(id) {
    if (!window.confirm("이 입력 내역을 삭제할까요?")) return;
    const { error: deleteError } = await supabase.from("donation_entries").delete().eq("id", id);
    if (deleteError) {
      window.alert("삭제에 실패했어요: " + deleteError.message);
      return;
    }
    load();
    onChanged?.();
  }

  return (
    <div className="rounded-xl border border-black/10 bg-white/60 p-5 dark:border-white/10 dark:bg-white/5">
      <h2 className="font-serif text-lg font-semibold text-foreground">{title || goalKey}</h2>
      <p className="mt-1 text-sm text-foreground/60">
        현재 누적 {total.toLocaleString("ko-KR")}원
        {target > 0 && ` · 목표 ${target.toLocaleString("ko-KR")}원 (${Math.min(100, Math.round((total / target) * 100))}%)`}
      </p>

      <div className="mt-4 flex items-end gap-2">
        <div className="flex-1">
          <label className="block text-xs text-foreground/60">목표 금액 (원)</label>
          <input
            type="text"
            inputMode="numeric"
            value={targetInput}
            onChange={(e) => setTargetInput(e.target.value)}
            className="mt-1 w-full rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/10"
          />
        </div>
        <button
          onClick={handleSaveTarget}
          disabled={savingTarget}
          className="rounded-full border border-black/10 px-3 py-2 text-sm text-foreground/70 hover:bg-black/5 disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/10"
        >
          목표 저장
        </button>
      </div>

      <div className="mt-4 flex items-end gap-2">
        <div className="flex-1">
          <label className="block text-xs text-foreground/60">이번 주 헌금액 (원)</label>
          <input
            type="text"
            inputMode="numeric"
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            placeholder="500000"
            className="mt-1 w-full rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/10"
          />
        </div>
        <div className="w-28">
          <label className="block text-xs text-foreground/60">메모(선택)</label>
          <input
            type="text"
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            placeholder="8월 4주"
            className="mt-1 w-full rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/10"
          />
        </div>
        <button
          onClick={handleAddEntry}
          disabled={adding}
          className="rounded-full bg-brand px-4 py-2 text-sm text-white hover:bg-brand-dark disabled:opacity-50"
        >
          추가
        </button>
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {entries.length > 0 && (
        <ul className="mt-4 divide-y divide-black/10 border-t border-black/10 dark:divide-white/10 dark:border-white/10">
          {entries.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-2 py-2 text-sm">
              <span className="text-foreground/70">
                {e.note || new Date(e.created_at).toLocaleDateString("ko-KR")}
              </span>
              <span className="flex items-center gap-2">
                <span className="font-medium text-foreground">{e.amount.toLocaleString("ko-KR")}원</span>
                <button
                  onClick={() => handleDeleteEntry(e.id)}
                  className="text-xs text-foreground/30 hover:text-red-600"
                >
                  삭제
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AdminDonationGoalsPage() {
  const { user, loading: authLoading, isAdmin } = useAuth();

  if (!authLoading && !isAdmin) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 text-center">
        <h1 className="font-serif text-2xl font-bold text-foreground">헌금 목표 관리</h1>
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
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-3 pb-12">
      <h1 className="font-serif text-2xl font-bold text-foreground">헌금 목표 관리</h1>
      <p className="mt-2 text-sm text-foreground/50">
        목표 금액을 설정하고, 매주 들어온 헌금액을 입력하면 헌금안내 페이지의 온도계에 자동 반영돼요.
      </p>

      <div className="mt-6 space-y-6">
        {GOAL_KEYS.map((key) => (
          <GoalManager key={key} goalKey={key} />
        ))}
      </div>
    </main>
  );
}
