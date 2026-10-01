"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { canManageYouth, canViewYouth, parseYouthBulletinDate } from "@/lib/youth";
import { splitBibleRefs } from "@/lib/bibleBooks";
import KakaoShareButton from "@/components/KakaoShareButton";
import { resizeImageFile } from "@/lib/resizeImage";
import { safeStoragePath } from "@/lib/storagePath";
import { uploadFileWithRetry } from "@/lib/uploadWithRetry";

function coverUrl(path) {
  return path ? supabase.storage.from("attachments").getPublicUrl(path).data.publicUrl : null;
}

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
  const [openId, setOpenId] = useState(null); // 지난 주보 중 펼친 것
  const [openPast, setOpenPast] = useState(false);
  const current = items[0] ?? null;
  const past = items.slice(1);

  // 등록/수정 폼. editingId가 있으면 수정.
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [body, setBody] = useState("");
  const [date, setDate] = useState("");
  const [coverPath, setCoverPath] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("youth_bulletins")
      .select("id, bulletin_date, body, cover_path")
      .order("bulletin_date", { ascending: false })
      .order("id", { ascending: false });
    setItems(data ?? []);
    // 카톡으로 지난 주보를 공유받아 들어온 경우 지난 주보 칸을 열어 둔다.
    const sharedId = Number(new URLSearchParams(window.location.search).get("id"));
    if (sharedId && data?.[0]?.id !== sharedId && data?.some((b) => b.id === sharedId)) {
      setOpenId(sharedId);
      setOpenPast(true);
    }
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

  useEffect(() => {
    if (!coverFile) {
      setCoverPreview(null);
      return;
    }
    const url = URL.createObjectURL(coverFile);
    setCoverPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [coverFile]);

  function startNew() {
    setEditingId(null);
    setBody("");
    setDate("");
    setCoverPath(null);
    setCoverFile(null);
    setError("");
    setShowForm(true);
  }

  function startEdit(item) {
    setEditingId(item.id);
    setBody(item.body);
    setDate(item.bulletin_date);
    setCoverPath(item.cover_path);
    setCoverFile(null);
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

    let nextCoverPath = coverPath;
    if (coverFile) {
      const resized = await resizeImageFile(coverFile, { maxSize: 1600 });
      const path = safeStoragePath("youth-bulletins", resized.name);
      const { error: uploadError } = await uploadFileWithRetry("attachments", path, resized);
      if (uploadError) {
        setSaving(false);
        setError("표지 사진 업로드에 실패했어요: " + uploadError.message);
        return;
      }
      nextCoverPath = path;
    }

    const payload = { bulletin_date: date, body: body.trim(), cover_path: nextCoverPath };
    const { error: saveError } = editingId
      ? await supabase.from("youth_bulletins").update(payload).eq("id", editingId)
      : await supabase.from("youth_bulletins").insert(payload);
    setSaving(false);
    if (saveError) {
      setError("저장에 실패했어요: " + saveError.message);
      return;
    }
    // 사진을 바꿨으면 예전 표지 파일은 정리
    if (coverPath && coverPath !== nextCoverPath) {
      await supabase.storage.from("attachments").remove([coverPath]);
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
    if (item.cover_path) await supabase.storage.from("attachments").remove([item.cover_path]);
    load();
  }

  if (!auth.loading && (!auth.user || !canViewYouth(auth))) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 text-center">
        <h1 className="font-serif text-2xl font-bold text-foreground">청년부 주보</h1>
        <p className="mt-3 text-sm text-foreground/60">청년부 회원만 볼 수 있어요.</p>
        {!auth.user && (
          <Link
            href={`/login?next=${encodeURIComponent(
              "/youth/bulletin" + (typeof window !== "undefined" ? window.location.search : "")
            )}`}
            className="mt-6 inline-block text-brand-dark underline"
          >
            로그인하러 가기
          </Link>
        )}
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
          <div>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground/60">
              <span className="rounded-full border border-black/10 px-3 py-1.5 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10">
                🖼️ 표지 사진 {coverPath || coverFile ? "바꾸기" : "선택"}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
                className="hidden"
              />
            </label>
            {(coverPreview || coverUrl(coverPath)) && (
              <div className="mt-2 flex items-start gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverPreview || coverUrl(coverPath)}
                  alt="표지 미리보기"
                  className="h-32 rounded-lg border border-black/10 object-cover dark:border-white/10"
                />
                <button
                  type="button"
                  onClick={() => {
                    setCoverFile(null);
                    setCoverPath(null);
                  }}
                  className="text-xs text-foreground/40 hover:text-red-600"
                >
                  ✕ 빼기
                </button>
              </div>
            )}
          </div>
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

      {loading && <p className="mt-6 text-sm text-foreground/50">불러오는 중...</p>}
      {!loading && items.length === 0 && (
        <p className="mt-6 text-sm text-foreground/50">아직 등록된 주보가 없어요.</p>
      )}

      {/* 이번 주 주보는 항상 펼쳐서 */}
      {current && (
        <section className="mt-6 rounded-xl border border-black/10 bg-white/60 dark:border-white/10 dark:bg-white/5">
          <p className="px-5 pt-4 font-medium text-foreground">{formatDate(current.bulletin_date)}</p>
          {renderContent(current)}
        </section>
      )}

      {/* 지난 주보는 메인 주보처럼 접어 두고 날짜별로 펼쳐 보기 */}
      {past.length > 0 && (
        <section className="mt-10 border-t border-black/10 pt-6 dark:border-white/10">
          <button
            type="button"
            onClick={() => setOpenPast((v) => !v)}
            className="flex w-full items-center justify-between gap-2 text-left"
          >
            <h2 className="font-serif font-semibold text-foreground">지난 주보</h2>
            <span className="text-xs text-foreground/50">{openPast ? "접기 ▲" : "펼치기 ▼"}</span>
          </button>
          {openPast && (
            <ul className="mt-3 divide-y divide-black/10 rounded-xl border border-black/10 bg-white/60 dark:divide-white/10 dark:border-white/10 dark:bg-white/5">
              {past.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => setOpenId(openId === item.id ? null : item.id)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-black/5 dark:hover:bg-white/10"
                  >
                    <span className="font-medium text-foreground">{formatDate(item.bulletin_date)}</span>
                    <span className="text-foreground/40">{openId === item.id ? "숨기기" : "보기"}</span>
                  </button>
                  {openId === item.id && renderContent(item)}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  );

  function renderContent(item) {
    return (
              <div className="border-t border-black/5 px-5 py-4 dark:border-white/10">
                {item.cover_path && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={coverUrl(item.cover_path)}
                    alt={`${formatDate(item.bulletin_date)} 청년부 주보 표지`}
                    className="mb-4 w-full rounded-lg border border-black/10 dark:border-white/10"
                  />
                )}
                <p className="whitespace-pre-wrap break-keep text-[15px] leading-7 text-foreground/90">
                  {splitBibleRefs(item.body).map((part, i) =>
                    part.href ? (
                      <a
                        key={i}
                        href={part.href}
                        className="text-brand-dark underline decoration-brand-dark/40 underline-offset-2"
                      >
                        {part.text}
                      </a>
                    ) : (
                      part.text
                    )
                  )}
                </p>
                <div className="mt-4">
                  <KakaoShareButton
                    title={`길가는교회 청년부 주보 (${formatDate(item.bulletin_date)})`}
                    description={
                      item.body.match(/제목\s*:\s*(.+)/)?.[1]?.trim() ?? item.body.split("\n")[0]
                    }
                    url={`${window.location.origin}/youth/bulletin?id=${item.id}`}
                    imageUrl={coverUrl(item.cover_path)}
                  />
                </div>
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
    );
  }
}
