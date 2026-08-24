"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabaseClient";

const CATEGORIES = [
  { key: "prayer", label: "기도게시판" },
  { key: "share", label: "나눔게시판" },
  { key: "help", label: "앱사용문의" },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function BoardPage() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [category, setCategory] = useState(CATEGORIES[0].key);
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function loadPosts(cat) {
    setLoadingPosts(true);
    const { data, error } = await supabase
      .from("posts")
      .select("id, title, body, author_name, created_at, attachment_url, attachment_name, user_id")
      .eq("category", cat)
      .order("created_at", { ascending: false });

    if (!error) setPosts(data);
    setLoadingPosts(false);
  }

  useEffect(() => {
    loadPosts(category);
  }, [category]);

  function handleFileChange(e) {
    const f = e.target.files?.[0] ?? null;
    if (f && f.size > MAX_FILE_SIZE) {
      setError("파일은 10MB 이하만 첨부할 수 있어요.");
      e.target.value = "";
      setFile(null);
      return;
    }
    setError("");
    setFile(f);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    let attachmentUrl = null;
    let attachmentName = null;

    if (file) {
      const path = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("attachments")
        .upload(path, file);

      if (uploadError) {
        setSubmitting(false);
        setError("파일 업로드에 실패했어요: " + uploadError.message);
        return;
      }
      attachmentUrl = supabase.storage.from("attachments").getPublicUrl(path).data.publicUrl;
      attachmentName = file.name;
    }

    const authorName = user.user_metadata?.display_name || user.email;
    const { error } = await supabase.from("posts").insert({
      title,
      body,
      user_id: user.id,
      author_name: authorName,
      category,
      attachment_url: attachmentUrl,
      attachment_name: attachmentName,
    });

    setSubmitting(false);
    if (error) {
      setError("글 등록에 실패했어요: " + error.message);
      return;
    }
    setTitle("");
    setBody("");
    setFile(null);
    loadPosts(category);
  }

  async function handleDelete(postId) {
    if (!window.confirm("이 글을 삭제할까요?")) return;
    const { error } = await supabase.from("posts").delete().eq("id", postId);
    if (error) {
      window.alert("삭제에 실패했어요: " + error.message);
      return;
    }
    loadPosts(category);
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12">
      <h1 className="font-serif text-2xl font-bold text-foreground">게시판</h1>

      <div className="mt-6 flex gap-2 border-b border-black/10 dark:border-white/10">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setCategory(c.key)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              category === c.key
                ? "border-brand text-brand-dark"
                : "border-transparent text-foreground/50 hover:text-foreground/80"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {!authLoading && !user && (
        <p className="mt-4 text-sm text-foreground/50">
          글을 쓰려면{" "}
          <Link href="/login" className="text-brand-dark underline">
            로그인
          </Link>
          이 필요해요.
        </p>
      )}

      {user && (
        <form
          key={category}
          onSubmit={handleSubmit}
          className="mt-4 space-y-3 rounded-xl border border-black/10 bg-white/60 p-5 dark:border-white/10 dark:bg-white/5"
        >
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목"
            className="w-full rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/10"
          />
          <textarea
            required
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="내용을 나눠주세요"
            className="w-full rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/10"
          />
          <div>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground/60">
              <span className="rounded-full border border-black/10 px-3 py-1.5 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10">
                📎 파일 첨부
              </span>
              <input type="file" onChange={handleFileChange} className="hidden" />
              {file && <span className="text-foreground/70">{file.name}</span>}
            </label>
            <p className="mt-1 text-xs text-foreground/40">최대 10MB</p>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-brand px-4 py-2 text-sm text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
          >
            {submitting ? "등록 중..." : "글쓰기"}
          </button>
        </form>
      )}

      <ul className="mt-4 divide-y divide-black/10 rounded-xl border border-black/10 bg-white/60 dark:divide-white/10 dark:border-white/10 dark:bg-white/5">
        {loadingPosts && <li className="p-4 text-sm text-foreground/50">불러오는 중...</li>}
        {!loadingPosts && posts.length === 0 && (
          <li className="p-4 text-sm text-foreground/50">아직 등록된 글이 없어요.</li>
        )}
        {posts.map((post) => (
          <li key={post.id} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium text-foreground">{post.title}</p>
              {(isAdmin || post.user_id === user?.id) && (
                <button
                  onClick={() => handleDelete(post.id)}
                  className="shrink-0 text-xs text-foreground/40 hover:text-red-600"
                >
                  삭제
                </button>
              )}
            </div>
            <p className="mt-1 text-sm text-foreground/70">{post.body}</p>
            {post.attachment_url && (
              <a
                href={post.attachment_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-sm text-brand-dark underline"
              >
                📎 {post.attachment_name}
              </a>
            )}
            <p className="mt-2 text-xs text-foreground/50">
              {post.author_name} · {new Date(post.created_at).toLocaleDateString("ko-KR")}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
