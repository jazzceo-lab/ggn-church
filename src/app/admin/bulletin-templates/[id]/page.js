"use client";

import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const FIELD_TYPES = [
  { value: "text", label: "한 줄 텍스트" },
  { value: "long_text", label: "여러 줄 텍스트" },
  { value: "date", label: "날짜" },
  { value: "number", label: "숫자" },
];

export default function TemplateEditPage() {
  const params = useParams();
  const { loading: authLoading, isAdmin, churchId } = useAuth();
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [templateDesc, setTemplateDesc] = useState("");
  const [fields, setFields] = useState([]);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState("text");
  const [draggedId, setDraggedId] = useState(null);

  useEffect(() => {
    if (!churchId || !params.id) return;
    loadTemplate();
  }, [churchId, params.id]);

  async function loadTemplate() {
    setLoading(true);
    const { data, error } = await supabase
      .from("bulletin_templates")
      .select("*")
      .eq("id", params.id)
      .eq("church_id", churchId)
      .single();

    if (!error && data) {
      setTemplate(data);
      setTemplateName(data.name);
      setTemplateDesc(data.description || "");
      setFields(data.fields || []);
    }
    setLoading(false);
  }

  async function handleSaveTemplate() {
    try {
      const { error } = await supabase
        .from("bulletin_templates")
        .update({
          name: templateName,
          description: templateDesc,
          fields: fields,
          updated_at: new Date().toISOString(),
        })
        .eq("id", params.id);

      if (error) throw error;

      setMessage("저장되었습니다.");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage(`저장 실패: ${error.message}`);
    }
  }

  function handleAddField() {
    if (!newFieldName.trim()) {
      setMessage("필드 이름을 입력해주세요.");
      return;
    }

    const newField = {
      id: `field_${Date.now()}`,
      name: newFieldName,
      type: newFieldType,
      required: true,
      order: fields.length,
    };

    setFields([...fields, newField]);
    setNewFieldName("");
    setNewFieldType("text");
    setMessage("필드가 추가되었습니다.");
    setTimeout(() => setMessage(""), 3000);
  }

  function handleRemoveField(id) {
    setFields(fields.filter((f) => f.id !== id));
  }

  function handleDragStart(e, id) {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleDrop(e, targetId) {
    e.preventDefault();
    if (draggedId === targetId) {
      setDraggedId(null);
      return;
    }

    const draggedIndex = fields.findIndex((f) => f.id === draggedId);
    const targetIndex = fields.findIndex((f) => f.id === targetId);

    const newFields = [...fields];
    const [removed] = newFields.splice(draggedIndex, 1);
    newFields.splice(targetIndex, 0, removed);

    const reordered = newFields.map((f, idx) => ({ ...f, order: idx }));
    setFields(reordered);
    setDraggedId(null);
  }

  function toggleRequired(id) {
    setFields(
      fields.map((f) => (f.id === id ? { ...f, required: !f.required } : f))
    );
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

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
        <p className="text-center text-sm text-foreground/50">로드 중...</p>
      </main>
    );
  }

  if (!template) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 text-center">
        <p className="text-foreground/60">템플릿을 찾을 수 없습니다.</p>
        <Link href="/admin/bulletin-templates" className="mt-6 inline-block text-brand-dark underline">
          템플릿 목록으로 돌아가기
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-3 pb-12">
      <div className="mb-8 flex items-center gap-4">
        <Link href="/admin/bulletin-templates" className="text-brand-dark hover:underline">
          ← 목록
        </Link>
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">템플릿 편집</h1>
          <p className="mt-1 text-sm text-foreground/50">{templateName}</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* 기본정보 */}
        <div className="rounded-xl border border-black/10 bg-white/60 p-6 dark:border-white/10 dark:bg-white/5">
          <h2 className="mb-4 font-medium text-foreground">기본정보</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-foreground/60">템플릿 이름</label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-black/10 bg-white/50 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
              />
            </div>
            <div>
              <label className="block text-sm text-foreground/60">설명</label>
              <textarea
                value={templateDesc}
                onChange={(e) => setTemplateDesc(e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-lg border border-black/10 bg-white/50 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
              />
            </div>
          </div>
        </div>

        {/* 필드 추가 */}
        <div className="rounded-xl border border-black/10 bg-white/60 p-6 dark:border-white/10 dark:bg-white/5">
          <h2 className="mb-4 font-medium text-foreground">필드 추가</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-foreground/60">필드 이름</label>
              <input
                type="text"
                value={newFieldName}
                onChange={(e) => setNewFieldName(e.target.value)}
                placeholder="예: 제목, 말씀, 기도제목"
                className="mt-1 w-full rounded-lg border border-black/10 bg-white/50 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
              />
            </div>
            <div>
              <label className="block text-sm text-foreground/60">필드 타입</label>
              <select
                value={newFieldType}
                onChange={(e) => setNewFieldType(e.target.value)}
                className="mt-1 w-full rounded-lg border border-black/10 bg-white/50 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
              >
                {FIELD_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleAddField}
              className="w-full rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
            >
              필드 추가
            </button>
          </div>
        </div>

        {/* 필드 목록 */}
        <div className="rounded-xl border border-black/10 bg-white/60 p-6 dark:border-white/10 dark:bg-white/5">
          <h2 className="mb-4 font-medium text-foreground">필드 목록 ({fields.length}개)</h2>

          {fields.length === 0 ? (
            <p className="text-sm text-foreground/50">필드가 없습니다. 위에서 필드를 추가해주세요.</p>
          ) : (
            <div className="space-y-2">
              {fields.map((field, idx) => (
                <div
                  key={field.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, field.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, field.id)}
                  className={`flex items-center gap-3 rounded-lg border border-black/10 p-3 transition-all dark:border-white/10 ${
                    draggedId === field.id ? "opacity-50 bg-black/5" : ""
                  }`}
                >
                  <span className="text-foreground/40">☰</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm">{field.name}</p>
                    <p className="text-xs text-foreground/50">
                      {FIELD_TYPES.find((t) => t.value === field.type)?.label}
                    </p>
                  </div>

                  <label className="flex items-center gap-2 text-sm text-foreground/60 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={() => toggleRequired(field.id)}
                      className="h-4 w-4 accent-brand"
                    />
                    필수
                  </label>

                  <button
                    onClick={() => handleRemoveField(field.id)}
                    className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20"
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 저장 버튼 */}
        {message && (
          <p className={`text-sm ${message.includes("실패") ? "text-red-600" : "text-green-600"}`}>
            {message}
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleSaveTemplate}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
          >
            💾 저장
          </button>
          <Link
            href="/admin/bulletin-templates"
            className="rounded-lg border border-black/10 px-4 py-2 text-sm font-medium text-foreground hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
          >
            목록으로
          </Link>
        </div>
      </div>
    </main>
  );
}
