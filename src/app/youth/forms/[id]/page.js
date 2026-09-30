"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { formIsOpen } from "@/lib/forms";

// easychurch-app /forms/[id] 이식. 권한은 DB(RLS)가 청년부·청년부 관리자로 제한.
export default function YouthFormRespondPage() {
  const { id } = useParams();
  const { user, loading } = useAuth();
  const [form, setForm] = useState(undefined);
  const [answers, setAnswers] = useState({});
  const [answered, setAnswered] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("forms").select("*").eq("id", id).maybeSingle().then(({ data }) => setForm(data ?? null));
    supabase
      .from("form_responses")
      .select("answers")
      .eq("form_id", id)
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setAnswers(data.answers ?? {});
          setAnswered(true);
        }
      });
  }, [user, id]);

  if (loading) return null;
  if (!user) return <main className="flex-1 p-8 text-sm text-foreground/50">로그인 후 이용할 수 있어요.</main>;
  if (form === undefined) return <main className="flex-1 p-8 text-sm text-foreground/50">불러오는 중...</main>;
  if (!form) return <main className="flex-1 p-8 text-sm text-foreground/50">찾을 수 없어요.</main>;

  const open = formIsOpen(form);
  const set = (qid, v) => setAnswers((prev) => ({ ...prev, [qid]: v }));

  async function submit(e) {
    e.preventDefault();
    const missing = form.questions.find(
      (q) => q.required && !(Array.isArray(answers[q.id]) ? answers[q.id].length : String(answers[q.id] ?? "").trim())
    );
    if (missing) return window.alert(`"${missing.label}"에 답해 주세요.`);
    setSaving(true);
    const { error } = await supabase
      .from("form_responses")
      .upsert({ form_id: form.id, user_id: user.id, answers, updated_at: new Date().toISOString() });
    setSaving(false);
    if (error) return window.alert("제출하지 못했어요: " + error.message);
    setAnswered(true);
    window.alert(answered ? "수정했어요." : "제출했어요. 감사합니다!");
  }

  async function cancel() {
    if (!window.confirm("신청(응답)을 취소할까요?")) return;
    await supabase.from("form_responses").delete().eq("form_id", form.id).eq("user_id", user.id);
    setAnswers({});
    setAnswered(false);
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-3 pb-12">
      <Link href="/youth/forms" className="text-sm text-foreground/60 underline">← 목록</Link>
      <h1 className="mt-3 font-serif text-2xl font-bold text-foreground">{form.title}</h1>
      {form.description && <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/70">{form.description}</p>}
      {form.closes_at && <p className="mt-1 text-xs text-foreground/50">{new Date(form.closes_at).toLocaleString("ko-KR")} 마감</p>}
      {answered && (
        <p className="mt-3 rounded-lg bg-brand-tint px-3 py-2 text-sm text-brand-dark">
          ✓ 응답했어요{open && " — 마감 전까지 수정할 수 있어요."}
        </p>
      )}
      {!open && <p className="mt-3 rounded-lg bg-black/5 px-3 py-2 text-sm dark:bg-white/10">마감되었어요.</p>}

      <form onSubmit={submit} className="mt-6 space-y-5">
        {form.questions.map((q) => (
          <fieldset key={q.id} disabled={!open}>
            <legend className="text-sm font-medium text-foreground">
              {q.label} {q.required && <span className="text-red-500">*</span>}
            </legend>
            {q.type === "text" && (
              <textarea
                rows={2}
                value={answers[q.id] ?? ""}
                onChange={(e) => set(q.id, e.target.value)}
                className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/10"
              />
            )}
            {q.type !== "text" &&
              (q.options ?? []).map((o) => {
                const multi = q.type === "multi";
                const cur = answers[q.id];
                const checked = multi ? (cur ?? []).includes(o) : cur === o;
                return (
                  <label key={o} className="mt-1 flex items-center gap-2 text-sm">
                    <input
                      type={multi ? "checkbox" : "radio"}
                      name={q.id}
                      checked={checked}
                      onChange={() => set(q.id, multi ? (checked ? cur.filter((v) => v !== o) : [...(cur ?? []), o]) : o)}
                    />
                    {o}
                  </label>
                );
              })}
          </fieldset>
        ))}
        {open && (
          <div className="flex gap-2">
            <button disabled={saving} className="rounded-full bg-brand px-5 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50">
              {saving ? "제출 중..." : answered ? "수정하기" : form.kind === "signup" ? "신청하기" : "제출하기"}
            </button>
            {answered && (
              <button type="button" onClick={cancel} className="rounded-full border border-black/10 px-4 py-2 text-sm dark:border-white/10">
                취소
              </button>
            )}
          </div>
        )}
      </form>
    </main>
  );
}
