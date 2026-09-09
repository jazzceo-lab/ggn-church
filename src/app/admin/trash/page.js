"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabaseClient";

export default function TrashPage() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [deletedPosts, setDeletedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [memberNames, setMemberNames] = useState({});
  const [restoringId, setRestoringId] = useState(null);
  const [permanentlyDeleting, setPermanentlyDeleting] = useState(null);

  useEffect(() => {
    if (isAdmin) {
      loadDeletedPosts();
      loadMemberNames();
    }
  }, [isAdmin]);

  async function loadDeletedPosts() {
    setLoading(true);
    const { data, error: loadError } = await supabase
      .from("posts")
      .select("id, title, body, category, district, author_name, created_at, deleted_at, deleted_by")
      .eq("is_deleted", true)
      .order("deleted_at", { ascending: false });

    if (loadError) {
      setError("삭제된 글을 불러오지 못했어요: " + loadError.message);
    } else {
      setDeletedPosts(data ?? []);
      setError("");
    }
    setLoading(false);
  }

  async function loadMemberNames() {
    const { data, error } = await supabase
      .from("member_directory")
      .select("id, display_name");

    if (!error) {
      const names = {};
      data?.forEach((m) => {
        names[m.id] = m.display_name;
      });
      setMemberNames(names);
    }
  }

  async function handleRestore(postId) {
    if (!window.confirm("이 글을 복구할까요?")) return;

    setRestoringId(postId);
    const { error } = await supabase
      .from("posts")
      .update({
        is_deleted: false,
        deleted_at: null,
        deleted_by: null,
      })
      .eq("id", postId);

    setRestoringId(null);
    if (error) {
      window.alert("복구에 실패했어요: " + error.message);
      return;
    }

    loadDeletedPosts();
  }

  async function handlePermanentlyDelete(postId) {
    if (!window.confirm("이 글을 영구 삭제할까요? 되돌릴 수 없습니다.")) return;

    setPermanentlyDeleting(postId);
    const { error } = await supabase.from("posts").delete().eq("id", postId);

    setPermanentlyDeleting(null);
    if (error) {
      window.alert("삭제에 실패했어요: " + error.message);
      return;
    }

    loadDeletedPosts();
  }

  if (authLoading) {
    return (
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12">
        <p className="text-center text-foreground/50">로드 중...</p>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12 text-center">
        <h1 className="font-serif text-2xl font-bold text-foreground">휴지통</h1>
        <p className="mt-3 text-sm text-foreground/60">관리자만 볼 수 있는 페이지예요.</p>
        {!user && (
          <Link
            href="/login"
            className="mt-6 inline-block rounded-full bg-brand px-4 py-2 text-sm text-white transition-colors hover:bg-brand-dark"
          >
            로그인하러 가기
          </Link>
        )}
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 pt-3 pb-12">
      <h1 className="font-serif text-2xl font-bold text-foreground">🗑️ 휴지통</h1>
      <p className="mt-2 text-sm text-foreground/50">
        삭제된 게시물을 복구하거나 영구 삭제할 수 있어요.
      </p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="mt-6 text-sm text-foreground/50">불러오는 중...</p>
      ) : deletedPosts.length === 0 ? (
        <p className="mt-6 text-sm text-foreground/50">삭제된 글이 없어요.</p>
      ) : (
        <ul className="mt-4 divide-y divide-black/10 rounded-xl border border-black/10 bg-white/60 dark:divide-white/10 dark:border-white/10 dark:bg-white/5">
          {deletedPosts.map((post) => (
            <li key={post.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-brand-tint px-2 py-0.5 text-xs font-medium text-brand-dark">
                    {post.category === "district" ? `${post.district} 구역` : post.category}
                  </span>
                  <p className="font-medium text-foreground">{post.title}</p>
                </div>
                <p className="mt-1 text-xs text-foreground/50">
                  작성: {post.author_name} · {new Date(post.created_at).toLocaleDateString("ko-KR")}
                </p>
                <p className="text-xs text-red-600">
                  삭제됨: {new Date(post.deleted_at).toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {post.deleted_by && ` · 삭제자: ${memberNames[post.deleted_by] || "알 수 없음"}`}
                </p>
              </div>

              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => handleRestore(post.id)}
                  disabled={restoringId === post.id}
                  className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-200 disabled:opacity-50 dark:bg-green-900/40 dark:text-green-300"
                >
                  {restoringId === post.id ? "복구 중..." : "복구"}
                </button>
                <button
                  onClick={() => handlePermanentlyDelete(post.id)}
                  disabled={permanentlyDeleting === post.id}
                  className="rounded-full border border-black/10 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50 dark:border-white/10 dark:hover:bg-red-900/40"
                >
                  {permanentlyDeleting === post.id ? "삭제 중..." : "영구 삭제"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
