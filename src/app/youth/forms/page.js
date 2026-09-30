"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { countChoices, formIsOpen } from "@/lib/forms";
import { toCsv } from "@/lib/csv";
import { canManageYouth, canViewYouth } from "@/lib/youth";

// easychurch-app의 /forms + /admin/forms를 한 화면으로 합친 청년부 신청·설문.
// 청년부 관리자(관리자·목회자·임원진)는 관리자 페이지에 못 들어가는 경우가 있어 여기서 바로 관리한다.
const TYPES = { text: "주관식", choice: "하나 선택", multi: "여러 개 선택" };
const EMPTY = { title: "", description: "", kind: "signup", closes_at: "", questions: [] };
const input = "w-full rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/10";

function newQuestion() {
  return { id: Math.random().toString(36).slice(2, 8), label: "", type: "choice", options: [], required: false };
}

function FormEditor({ initial, onDone }) {
  const [f, setF] = useState(() => ({ ...initial, closes_at: initial.closes_at ? initial.closes_at.slice(0, 16) : "" }));
  const setQ = (i, patch) => setF((p) => ({ ...p, questions: p.questions.map((q, j) => (j === i ? { ...q, ...patch } : q)) }));

  async function save() {
    if (!f.title.trim()) return window.alert("제목을 입력해 주세요.");
    const row = {
      title: f.title.trim(),
      description: f.description || null,
      kind: f.kind,
      closes_at: f.closes_at ? new Date(f.closes_at).toISOString() : null,
      questions: f.questions.filter((q) => q.label.trim()),
    };
    const { error } = f.id ? await supabase.from("forms").update(row).eq("id", f.id) : await supabase.from("forms").insert(row);
    if (error) return window.alert("저장하지 못했어요: " + error.message);
    onDone();
  }

  return (
    <div className="space-y-3 rounded-xl border border-brand/30 p-4">
      <input className={input} placeholder="제목 (예: 가을 수련회 신청)" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
      <textarea className={input} rows={3} placeholder="안내 (일시·장소·회비 등)" value={f.description ?? ""} onChange={(e) => setF({ ...f, description: e.target.value })} />
      <div className="flex flex-wrap gap-3 text-sm">
        <select className="rounded-lg border border-black/10 px-2 py-1 dark:border-white/10 dark:bg-white/10" value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })}>
          <option value="signup">📝 신청</option>
          <option value="survey">📊 설문</option>
        </select>
        <label className="flex items-center gap-1">
          마감
          <input type="datetime-local" className="rounded-lg border border-black/10 px-2 py-1 dark:border-white/10 dark:bg-white/10" value={f.closes_at} onChange={(e) => setF({ ...f, closes_at: e.target.value })} />
        </label>
      </div>
      {f.questions.map((q, i) => (
        <div key={q.id} className="space-y-2 rounded-lg bg-black/5 p-3 dark:bg-white/5">
          <div className="flex gap-2">
            <input className={input} placeholder={`질문 ${i + 1}`} value={q.label} onChange={(e) => setQ(i, { label: e.target.value })} />
            <select className="rounded-lg border border-black/10 px-2 text-sm dark:border-white/10 dark:bg-white/10" value={q.type} onChange={(e) => setQ(i, { type: e.target.value })}>
              {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          {q.type !== "text" && (
            <input
              className={input}
              placeholder="선택지를 쉼표로 구분 (예: 참석, 불참)"
              defaultValue={(q.options ?? []).join(", ")}
              onBlur={(e) => setQ(i, { options: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
            />
          )}
          <div className="flex justify-between text-xs">
            <label className="flex items-center gap-1">
              <input type="checkbox" checked={!!q.required} onChange={(e) => setQ(i, { required: e.target.checked })} /> 필수
            </label>
            <button type="button" className="text-red-500" onClick={() => setF((p) => ({ ...p, questions: p.questions.filter((_, j) => j !== i) }))}>
              삭제
            </button>
          </div>
        </div>
      ))}
      <div className="flex gap-2">
        <button type="button" onClick={() => setF((p) => ({ ...p, questions: [...p.questions, newQuestion()] }))} className="rounded-full border border-brand px-3 py-1.5 text-sm text-brand-dark">
          + 질문 추가
        </button>
        <button type="button" onClick={save} className="rounded-full bg-brand px-4 py-1.5 text-sm text-white hover:bg-brand-dark">
          저장
        </button>
        <button type="button" onClick={onDone} className="px-3 py-1.5 text-sm text-foreground/60">
          닫기
        </button>
      </div>
    </div>
  );
}

function Results({ form }) {
  const [rows, setRows] = useState(null);
  const [names, setNames] = useState(new Map());

  useEffect(() => {
    supabase.from("form_responses").select("user_id, answers, updated_at").eq("form_id", form.id).order("created_at").then(({ data }) => setRows(data ?? []));
    // 임원진·목회자는 profiles 전체를 못 읽으므로 승인 회원이면 보이는 member_directory를 쓴다.
    supabase.from("member_directory").select("id, display_name, district").then(({ data }) => setNames(new Map((data ?? []).map((p) => [p.id, p]))));
  }, [form.id]);

  if (!rows) return <p className="mt-3 text-sm text-foreground/50">불러오는 중...</p>;
  const counts = countChoices(form.questions, rows);
  const fmt = (a) => (Array.isArray(a) ? a.join(", ") : (a ?? ""));

  function exportCsv() {
    const csv = toCsv([
      ["이름", "소속", ...form.questions.map((q) => q.label), "응답 시각"],
      ...rows.map((r) => [names.get(r.user_id)?.display_name, names.get(r.user_id)?.district, ...form.questions.map((q) => fmt(r.answers?.[q.id])), r.updated_at]),
    ]);
    const url = URL.createObjectURL(new Blob([String.fromCharCode(0xfeff) + csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${form.title}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mt-3 space-y-3 text-sm">
      <div className="flex items-center justify-between">
        <p className="font-medium">응답 {rows.length}명</p>
        {rows.length > 0 && <button type="button" onClick={exportCsv} className="text-xs text-brand-dark underline">엑셀(CSV)로 받기</button>}
      </div>
      {form.questions.filter((q) => counts[q.id]).map((q) => (
        <div key={q.id}>
          <p className="text-foreground/70">{q.label}</p>
          {Object.entries(counts[q.id]).map(([o, n]) => (
            <div key={o} className="mt-1 flex items-center gap-2">
              <span className="w-24 truncate">{o}</span>
              <div className="h-2 flex-1 rounded bg-black/5 dark:bg-white/10">
                <div className="h-2 rounded bg-brand" style={{ width: `${rows.length ? (n / rows.length) * 100 : 0}%` }} />
              </div>
              <span className="w-8 text-right">{n}</span>
            </div>
          ))}
        </div>
      ))}
      <ul className="divide-y divide-black/5 dark:divide-white/10">
        {rows.map((r) => (
          <li key={r.user_id} className="py-1.5">
            <span className="font-medium">{names.get(r.user_id)?.display_name ?? "(탈퇴)"}</span>
            <span className="ml-2 text-foreground/60">{form.questions.map((q) => fmt(r.answers?.[q.id])).filter(Boolean).join(" · ")}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function YouthFormsPage() {
  const auth = useAuth();
  const { user } = auth;
  const canManage = canManageYouth(auth);
  const [forms, setForms] = useState([]);
  const [mine, setMine] = useState(new Set());
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);

  function load() {
    supabase
      .from("forms")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => setForms(data ?? []));
    supabase
      .from("form_responses")
      .select("form_id")
      .eq("user_id", user.id)
      .then(({ data }) => setMine(new Set((data ?? []).map((r) => r.form_id))));
  }

  useEffect(() => {
    if (user && canViewYouth(auth)) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, auth.district, auth.isBoardAdmin, auth.isAdmin]);

  async function toggle(f) {
    await supabase.from("forms").update({ is_open: !f.is_open }).eq("id", f.id);
    load();
  }

  async function remove(f) {
    if (!window.confirm(`"${f.title}"과 모든 응답을 삭제할까요?`)) return;
    await supabase.from("forms").delete().eq("id", f.id);
    load();
  }

  if (auth.loading) return null;
  if (!user || !canViewYouth(auth)) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 text-center">
        <h1 className="font-serif text-2xl font-bold text-foreground">신청·설문</h1>
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
        <h1 className="font-serif text-2xl font-bold text-foreground">신청·설문</h1>
        {canManage && !editing && (
          <button type="button" onClick={() => setEditing(EMPTY)} className="rounded-full bg-brand px-4 py-2 text-sm text-white hover:bg-brand-dark">
            + 새로 만들기
          </button>
        )}
      </div>

      {editing && (
        <div className="mt-4">
          <FormEditor key={editing.id ?? "new"} initial={editing} onDone={() => { setEditing(null); load(); }} />
        </div>
      )}

      {forms.length === 0 && <p className="mt-6 text-sm text-foreground/50">진행 중인 신청이나 설문이 없어요.</p>}
      <ul className="mt-6 grid gap-3">
        {forms.map((f) => (
          <li key={f.id} className="rounded-xl border border-black/10 bg-white/60 dark:border-white/10 dark:bg-white/5">
            <Link href={`/youth/forms/${f.id}`} className="block rounded-xl p-4 hover:bg-brand-tint/40">
              <p className="text-xs text-foreground/50">
                {f.kind === "survey" ? "📊 설문" : "📝 신청"} · {formIsOpen(f) ? "진행 중" : "마감"}
                {f.closes_at && ` · ${new Date(f.closes_at).toLocaleDateString("ko-KR")}까지`}
                {mine.has(f.id) && <span className="ml-2 text-brand-dark">✓ 응답함</span>}
              </p>
              <p className="mt-1 font-semibold text-foreground">{f.title}</p>
              {f.description && <p className="mt-1 line-clamp-2 text-sm text-foreground/60">{f.description}</p>}
            </Link>
            {canManage && (
              <div className="border-t border-black/5 px-4 py-2 dark:border-white/10">
                <div className="flex flex-wrap gap-3 text-xs">
                  <button type="button" onClick={() => setViewing(viewing === f.id ? null : f.id)} className="text-brand-dark underline">결과</button>
                  <button type="button" onClick={() => setEditing(f)} className="underline">수정</button>
                  <button type="button" onClick={() => toggle(f)} className="underline">{f.is_open ? "마감하기" : "다시 열기"}</button>
                  <button type="button" onClick={() => remove(f)} className="text-red-500 underline">삭제</button>
                </div>
                {viewing === f.id && <Results form={f} />}
              </div>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
