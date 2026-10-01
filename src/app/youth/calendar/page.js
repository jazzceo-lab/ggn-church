"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { YOUTH, canManageYouth, canViewYouth } from "@/lib/youth";

// 청년부 일정: 교회일정(calendar_events)에서 department='청년부'인 것만. 달력 대신 날짜순 목록.
const EMPTY = { event_date: "", event_end_date: "", time_label: "", title: "", description: "" };
const input = "w-full rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/10";

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatRange(e) {
  const fmt = (s) =>
    new Date(s + "T00:00:00").toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });
  return e.event_end_date && e.event_end_date !== e.event_date
    ? `${fmt(e.event_date)} ~ ${fmt(e.event_end_date)}`
    : fmt(e.event_date);
}

export default function YouthCalendarPage() {
  const auth = useAuth();
  const canManage = canManageYouth(auth);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null); // null이면 닫힘, {id?...}면 등록/수정
  const [showPast, setShowPast] = useState(false);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("calendar_events")
      .select("id, event_date, event_end_date, time_label, title, description")
      .eq("department", YOUTH)
      .order("event_date", { ascending: true });
    setEvents(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    if (auth.user && canViewYouth(auth)) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.user, auth.district, auth.isBoardAdmin, auth.isAdmin]);

  async function save(e) {
    e.preventDefault();
    if (!form.event_date || !form.title.trim()) return window.alert("날짜와 제목을 입력해주세요.");
    const payload = {
      event_date: form.event_date,
      event_end_date: form.event_end_date || null,
      time_label: form.time_label.trim() || null,
      title: form.title.trim(),
      description: form.description.trim() || null,
      department: YOUTH,
    };
    const { error } = form.id
      ? await supabase.from("calendar_events").update(payload).eq("id", form.id)
      : await supabase.from("calendar_events").insert({ ...payload, created_by: auth.user.id });
    if (error) return window.alert("저장에 실패했어요: " + error.message);
    setForm(null);
    load();
  }

  async function remove(ev) {
    if (!window.confirm(`"${ev.title}" 일정을 삭제할까요?`)) return;
    const { error } = await supabase.from("calendar_events").delete().eq("id", ev.id);
    if (error) return window.alert("삭제에 실패했어요: " + error.message);
    load();
  }

  if (auth.loading) return null;
  if (!auth.user || !canViewYouth(auth)) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 text-center">
        <h1 className="font-serif text-2xl font-bold text-foreground">청년부 일정</h1>
        <p className="mt-3 text-sm text-foreground/60">청년부 회원만 볼 수 있어요.</p>
      </main>
    );
  }

  const today = todayKey();
  const upcoming = events.filter((e) => (e.event_end_date || e.event_date) >= today);
  const past = events.filter((e) => (e.event_end_date || e.event_date) < today).reverse();

  const renderItem = (ev) => (
    <li key={ev.id} className="px-4 py-3">
      <p className="text-xs text-brand-dark">
        {formatRange(ev)}
        {ev.time_label && ` · ${ev.time_label}`}
      </p>
      <p className="mt-0.5 font-medium text-foreground">{ev.title}</p>
      {ev.description && <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/60">{ev.description}</p>}
      {canManage && (
        <div className="mt-2 flex gap-3 text-xs">
          <button
            onClick={() =>
              setForm({
                id: ev.id,
                event_date: ev.event_date,
                event_end_date: ev.event_end_date ?? "",
                time_label: ev.time_label ?? "",
                title: ev.title,
                description: ev.description ?? "",
              })
            }
            className="underline"
          >
            수정
          </button>
          <button onClick={() => remove(ev)} className="text-red-500 underline">
            삭제
          </button>
        </div>
      )}
    </li>
  );

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-3 pb-12">
      <Link href="/youth" className="text-sm text-foreground/50 underline">
        ← 청년부
      </Link>
      <div className="mt-2 flex items-center justify-between gap-3">
        <h1 className="font-serif text-2xl font-bold text-foreground">청년부 일정</h1>
        {canManage && !form && (
          <button
            onClick={() => setForm(EMPTY)}
            className="rounded-full bg-brand px-4 py-2 text-sm text-white transition-colors hover:bg-brand-dark"
          >
            + 일정 등록
          </button>
        )}
      </div>

      {form && (
        <form
          onSubmit={save}
          className="mt-4 space-y-3 rounded-xl border border-black/10 bg-white/60 p-5 dark:border-white/10 dark:bg-white/5"
        >
          <div className="flex flex-wrap gap-3 text-sm text-foreground/70">
            <label className="flex items-center gap-2">
              날짜
              <input type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} className="rounded-md border border-black/10 px-2 py-1 dark:border-white/10 dark:bg-white/10" />
            </label>
            <label className="flex items-center gap-2">
              끝나는 날(선택)
              <input type="date" value={form.event_end_date} onChange={(e) => setForm({ ...form, event_end_date: e.target.value })} className="rounded-md border border-black/10 px-2 py-1 dark:border-white/10 dark:bg-white/10" />
            </label>
          </div>
          <input className={input} placeholder="시간 (선택, 예: 오후 2시)" value={form.time_label} onChange={(e) => setForm({ ...form, time_label: e.target.value })} />
          <input className={input} placeholder="제목 (예: 청년부 성경묵상)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <textarea className={input} rows={3} placeholder="내용 (선택, 장소·준비물 등)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="flex gap-2">
            <button type="submit" className="rounded-full bg-brand px-4 py-2 text-sm text-white hover:bg-brand-dark">
              저장
            </button>
            <button type="button" onClick={() => setForm(null)} className="rounded-full border border-black/10 px-4 py-2 text-sm text-foreground/70 dark:border-white/10">
              취소
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="mt-6 text-sm text-foreground/50">불러오는 중...</p>
      ) : upcoming.length === 0 ? (
        <p className="mt-6 text-sm text-foreground/50">다가오는 일정이 없어요.</p>
      ) : (
        <ul className="mt-6 divide-y divide-black/10 rounded-xl border border-black/10 bg-white/60 dark:divide-white/10 dark:border-white/10 dark:bg-white/5">
          {upcoming.map(renderItem)}
        </ul>
      )}

      {past.length > 0 && (
        <section className="mt-10 border-t border-black/10 pt-6 dark:border-white/10">
          <button type="button" onClick={() => setShowPast((v) => !v)} className="flex w-full items-center justify-between text-left">
            <h2 className="font-serif font-semibold text-foreground">지난 일정</h2>
            <span className="text-xs text-foreground/50">{showPast ? "접기 ▲" : "펼치기 ▼"}</span>
          </button>
          {showPast && (
            <ul className="mt-3 divide-y divide-black/10 rounded-xl border border-black/10 bg-white/60 dark:divide-white/10 dark:border-white/10 dark:bg-white/5">
              {past.map(renderItem)}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}
