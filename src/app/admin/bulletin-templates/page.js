"use client";

import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function BulletinTemplatesPage() {
  const { loading: authLoading, isAdmin, churchId } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  useEffect(() => {
    if (!churchId) return;
    loadTemplates();
  }, [churchId]);

  async function loadTemplates() {
    setLoading(true);
    const { data, error } = await supabase
      .from("bulletin_templates")
      .select("*")
      .eq("church_id", churchId)
      .order("created_at", { ascending: false });

    if (!error) {
      setTemplates(data || []);
    }
    setLoading(false);
  }

  async function handleCreateTemplate() {
    if (!newName.trim()) {
      setMessage("템플릿 이름을 입력해주세요.");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("bulletin_templates")
        .insert([
          {
            church_id: churchId,
            name: newName,
            description: newDesc,
            fields: [],
          },
        ])
        .select();

      if (error) throw error;

      setTemplates([data[0], ...templates]);
      setNewName("");
      setNewDesc("");
      setShowNew(false);
      setMessage("템플릿이 생성되었습니다.");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage(`생성 실패: ${error.message}`);
    }
  }

  async function handleDeleteTemplate(id) {
    if (!window.confirm("이 템플릿을 삭제할까요?")) return;

    try {
      const { error } = await supabase
        .from("bulletin_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setTemplates(templates.filter((t) => t.id !== id));
      setMessage("템플릿이 삭제되었습니다.");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage(`삭제 실패: ${error.message}`);
    }
  }

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
        <h1 className="font-serif text-2xl font-bold text-foreground">주보 템플릿 관리</h1>
        <p className="mt-2 text-sm text-foreground/50">각 교회의 주보 양식을 템플릿으로 정의하세요.</p>
      </div>

      {/* 새 템플릿 생성 폼 */}
      {showNew && (
        <div className="mb-6 rounded-xl border border-black/10 bg-white/60 p-6 dark:border-white/10 dark:bg-white/5">
          <h2 className="mb-4 font-medium text-foreground">새 템플릿 생성</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-foreground/60">템플릿 이름</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="예: 주일주보, 월간주보"
                className="mt-1 w-full rounded-lg border border-black/10 bg-white/50 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
              />
            </div>
            <div>
              <label className="block text-sm text-foreground/60">설명</label>
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="템플릿 설명 (선택)"
                rows={2}
                className="mt-1 w-full rounded-lg border border-black/10 bg-white/50 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCreateTemplate}
                className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
              >
                생성
              </button>
              <button
                onClick={() => {
                  setShowNew(false);
                  setNewName("");
                  setNewDesc("");
                }}
                className="rounded-lg border border-black/10 px-4 py-2 text-sm font-medium text-foreground hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 템플릿 리스트 */}
      {loading ? (
        <p className="text-sm text-foreground/50">로드 중...</p>
      ) : templates.length === 0 ? (
        <div className="rounded-xl border border-black/10 bg-white/60 p-6 text-center dark:border-white/10 dark:bg-white/5">
          <p className="text-sm text-foreground/50">템플릿이 없습니다.</p>
          {!showNew && (
            <button
              onClick={() => setShowNew(true)}
              className="mt-4 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
            >
              + 첫 템플릿 생성
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="mb-4 flex justify-end">
            {!showNew && (
              <button
                onClick={() => setShowNew(true)}
                className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
              >
                + 새 템플릿
              </button>
            )}
          </div>

          <div className="grid gap-4">
            {templates.map((template) => (
              <div key={template.id} className="rounded-xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">{template.name}</h3>
                    {template.description && (
                      <p className="mt-1 text-sm text-foreground/60">{template.description}</p>
                    )}
                    <p className="mt-2 text-xs text-foreground/40">
                      필드 {template.fields?.length || 0}개 · {new Date(template.created_at).toLocaleDateString("ko-KR")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/bulletin-templates/${template.id}`}
                      className="rounded-lg border border-black/10 px-3 py-1.5 text-sm text-brand hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
                    >
                      편집
                    </Link>
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-100 dark:border-red-900/40 dark:hover:bg-red-900/20"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {message && (
        <p className={`mt-6 text-sm ${message.includes("실패") ? "text-red-600" : "text-green-600"}`}>
          {message}
        </p>
      )}
    </main>
  );
}
