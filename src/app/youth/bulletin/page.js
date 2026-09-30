"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { canManageYouth, canViewYouth, parseYouthBulletinDate } from "@/lib/youth";

function formatDate(d) {
  return new Date(d + "T00:00:00").toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

export default function YouthBulletinPage() {
  const auth = useAuth();
  const canManage = canManageYouth(auth);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);

  // 등록/수정 폼. editingId가 있으면 수정.
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [body, setBody] = useState("");
  const [date, setDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("youth_bulletins")
      .select("id, bulletin_date, body")
      .order("bulletin_date", { ascending: false })
      .order("id", { ascending: false });
    setItems(data ?? []);
    setOpenId((prev) => prev ?? data?.[0]?.id ?? null);
    setLoading(false);
  }

  useEffect(() => {
    if (auth.user && canViewYouth(auth)) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.user, auth.district, auth.isBoardAdmin, auth.isAdmin]);

  function handleBodyChange(value) {
    setBody(value);
    const parsed = parseYouthBulletinDate(value);
    if (parsed) setDate(parsed);
  }

  function startNew() {
    setEditingId(null);
    setBody("");
    setDate("");
    setError("");
    setShowForm(true);
  }

  function startEdit(item) {
    setEditingId(item.id);
    setBody(item.body);
    setDate(item.bulletin_date);
    setError("");
    setShowForm(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!body.trim() || !date) {
      setError("주보 내용과 날짜를 모두 입력해주세요. 첫 줄에 (2026.09.27)처럼 날짜가 있으면 자동으로 채워져요.");
      return;
    }
    setSaving(true);
    setError("");
    const payload = { bulletin_date: date, body: body.trim() };
    const { error: saveError } = editingId
      ? await supabase.from("youth_bulletins").update(payload).eq("id", editingId)
      : await supabase.from("youth_bulletins").insert(payload);
    setSaving(false);
    if (saveError) {
      setError("저장에 실패했어요: " + saveError.message);
      return;
    }
    setShowForm(false);
    setOpenId(null);
    load();
  }

  async function handleDelete(item) {
    if (!window.confirm(`${formatDate(item.bulletin_date)} 주보를 삭제할까요?`)) return;
    const { error: deleteError } = await supabase.from("youth_bulletins").delete().eq("id", item.id);
    if (deleteError) {
      window.alert("삭제에 실패했어요: " + deleteError.message);
      return;
    }
    load();
  }

  if (!auth.loading && (!auth.user || !canViewYouth(auth))) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 text-center">
        <h1 className="font-serif text-2xl font-bold text-foreground">청년부 주보</h1>
        <p className="mt-3 text-sm text-foreground/60">청년부 회원만 볼 수 있어요.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-3 pb-12">
      <Link href="/youth" className="text-sm text-foreground/50 underline">
        ← 청년부
      </Link>
      <div className="mt-2 flex items-center justify-between gap-3">
        <h1 className="font-serif text-2xl font-bold text-foreground">청년부 주보</h1>
        {canManage && !showForm && (
          <button
            onClick={startNew}
            className="rounded-full bg-brand px-4 py-2 text-sm text-white transition-colors hover:bg-brand-dark"
          >
            + 새 주보
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleSave}
          className="mt-4 space-y-3 rounded-xl border border-black/10 bg-white/60 p-5 dark:border-white/10 dark:bg-white/5"
        >
          <p className="text-sm font-medium text-foreground/80">{editingId ? "주보 수정" : "새 주보 등록"}</p>
          <p className="text-xs text-foreground/50">
            받은 주보 글을 그대로 붙여넣으세요. 첫 줄의 (2026.09.27)에서 날짜를 자동으로 읽어요.
          </p>
          <textarea
            rows={14}
            value={body}
            onChange={(e) => handleBodyChange(e.target.value)}
            placeholder={"(2026.09.27)청년부 주일\n인도 : \n제목 : \n본문 : \n찬양 : \n\n광고\n1. "}
            className="w-full rounded-md border border-black/10 px-3 py-2 text-sm leading-6 dark:border-white/10 dark:bg-white/10"
          />
          <label className="flex items-center gap-2 text-sm text-foreground/70">
            날짜
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-md border border-black/10 px-2 py-1 text-sm dark:border-white/10 dark:bg-white/10"
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-brand px-4 py-2 text-sm text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
            >
              {saving ? "저장 중..." : "저장"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-full border border-black/10 px-4 py-2 text-sm text-foreground/70 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
            >
              취소
            </button>
          </div>
        </form>
      )}

      <ul className="mt-6 space-y-3">
        {loading && <li className="text-sm text-foreground/50">불러오는 중...</li>}
        {!loading && items.length === 0 && (
          <li className="text-sm text-foreground/50">아직 등록된 주보가 없어요.</li>
        )}
        {items.map((item) => (
          <li
            key={item.id}
            className="rounded-xl border border-black/10 bg-white/60 dark:border-white/10 dark:bg-white/5"
          >
            <button
              onClick={() => setOpenId(openId === item.id ? null : item.id)}
              className="flex w-full items-center justify-between px-5 py-3 text-left"
            >
              <span className="font-medium text-foreground">{formatDate(item.bulletin_date)}</span>
              <span className="text-xs text-foreground/40">{openId === item.id ? "접기" : "펼치기"}</span>
            </button>
            {openId === item.id && (
              <div className="border-t border-black/5 px-5 py-4 dark:border-white/10">
                <p className="whitespace-pre-wrap break-keep text-[15px] leading-7 text-foreground/90">
                  {item.body}
                </p>
                {canManage && (
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => startEdit(item)}
                      className="rounded-full border border-black/10 px-3 py-1 text-xs text-foreground/70 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className="rounded-full border border-black/10 px-3 py-1 text-xs text-foreground/70 hover:bg-red-50 hover:text-red-600 dark:border-white/10 dark:hover:bg-red-900/20"
                    >
                      삭제
                    </button>
                  </div>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
