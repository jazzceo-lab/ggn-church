"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { safeStoragePath } from "@/lib/storagePath";
import { uploadFileWithRetry } from "@/lib/uploadWithRetry";

function noticeImageUrl(item) {
  return supabase.storage.from("attachments").getPublicUrl(item.image_path).data.publicUrl;
}

export default function AdminNoticesPage() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function loadNotices() {
    setLoading(true);
    const { data } = await supabase
      .from("popup_notices")
      .select("id, title, image_path, is_active, created_at")
      .order("created_at", { ascending: false });
    setNotices(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    if (isAdmin) loadNotices();
  }, [isAdmin]);

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setError("");

    const path = safeStoragePath("notices", file.name);
    const { error: uploadError } = await uploadFileWithRetry("attachments", path, file);
    if (uploadError) {
      setUploading(false);
      setError("업로드에 실패했어요: " + uploadError.message);
      return;
    }

    await supabase.from("popup_notices").update({ is_active: false }).eq("is_active", true);

    const { error: insertError } = await supabase
      .from("popup_notices")
      .insert({ title: title || null, image_path: path, is_active: true });

    if (insertError) {
      setUploading(false);
      setError("등록에 실패했어요: " + insertError.message);
      return;
    }

    setUploading(false);
    setTitle("");
    setFile(null);
    loadNotices();
  }

  async function toggleActive(notice) {
    if (!notice.is_active) {
      await supabase.from("popup_notices").update({ is_active: false }).eq("is_active", true);
    }
    const { error } = await supabase
      .from("popup_notices")
      .update({ is_active: !notice.is_active })
      .eq("id", notice.id);
    if (error) {
      window.alert("변경에 실패했어요: " + error.message);
      return;
    }
    loadNotices();
  }

  async function handleDelete(notice) {
    if (!window.confirm("이 공지를 삭제할까요?")) return;
    await supabase.storage.from("attachments").remove([notice.image_path]);
    const { error } = await supabase.from("popup_notices").delete().eq("id", notice.id);
    if (error) {
      window.alert("삭제에 실패했어요: " + error.message);
      return;
    }
    loadNotices();
  }

  if (!authLoading && !isAdmin) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 text-center">
        <h1 className="font-serif text-2xl font-bold text-foreground">공지 관리</h1>
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
      <h1 className="font-serif text-2xl font-bold text-foreground">공지 관리</h1>
      <p className="mt-2 text-sm text-foreground/50">
        앱을 처음 열었을 때 뜨는 팝업 공지를 등록해요. 활성화된 공지 1개만 팝업으로 떠요.
      </p>

      <form
        onSubmit={handleUpload}
        className="mt-6 space-y-3 rounded-xl border border-black/10 bg-white/60 p-5 dark:border-white/10 dark:bg-white/5"
      >
        <p className="text-sm font-medium text-foreground/80">새 공지 등록</p>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목 (선택, 관리용 메모)"
          className="w-full rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/10"
        />
        <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground/60">
          <span className="rounded-full border border-black/10 px-3 py-1.5 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10">
            🖼️ 이미지 선택
          </span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="hidden"
          />
          {file && <span className="text-foreground/70">{file.name}</span>}
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={uploading || !file}
          className="rounded-full bg-brand px-4 py-2 text-sm text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
        >
          {uploading ? "업로드 중..." : "등록 (자동으로 활성화)"}
        </button>
      </form>

      <ul className="mt-6 space-y-3">
        {loading && <li className="text-sm text-foreground/50">불러오는 중...</li>}
        {!loading && notices.length === 0 && (
          <li className="text-sm text-foreground/50">등록된 공지가 없어요.</li>
        )}
        {notices.map((notice) => (
          <li
            key={notice.id}
            className="flex items-center gap-3 rounded-xl border border-black/10 bg-white/60 p-3 dark:border-white/10 dark:bg-white/5"
          >
            <img
              src={noticeImageUrl(notice)}
              alt={notice.title ?? "공지"}
              className="h-16 w-16 shrink-0 rounded-lg border border-black/10 object-cover dark:border-white/10"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {notice.title || "(제목 없음)"}
                {notice.is_active && (
                  <span className="ml-2 rounded-full bg-brand-tint px-2 py-0.5 text-xs font-medium text-brand-dark">
                    활성
                  </span>
                )}
              </p>
              <p className="mt-1 text-xs text-foreground/40">
                {new Date(notice.created_at).toLocaleString("ko-KR")}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                onClick={() => toggleActive(notice)}
                className="rounded-full border border-black/10 px-3 py-1 text-xs text-foreground/70 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
              >
                {notice.is_active ? "비활성화" : "활성화"}
              </button>
              <button
                onClick={() => handleDelete(notice)}
                className="rounded-full border border-black/10 px-3 py-1 text-xs text-foreground/70 hover:bg-red-50 hover:text-red-600 dark:border-white/10 dark:hover:bg-red-900/20"
              >
                삭제
              </button>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
