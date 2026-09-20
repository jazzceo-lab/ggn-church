"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { safeStoragePath } from "@/lib/storagePath";
import { uploadFileWithRetry } from "@/lib/uploadWithRetry";
import KakaoShareButton from "@/components/KakaoShareButton";
import { REACTIONS } from "@/lib/reactions";

// "설교 음성" 탭은 관리자 요청으로 숨김 처리함 (관련 코드/데이터는 그대로 두고 탭만 뺌).
const TABS = [
  { key: "video", label: "찬양팀" },
  { key: "youtube", label: "유튜브 영상" },
];

// 설교 음성은 파일 용량이 커서 무료 저장공간을 아끼기 위해
// 새로 업로드하면 최신 2개(이번 주 + 지난주)만 남기고 이전 파일은 자동 삭제
const MAX_KEPT_AUDIO = 2;


export default function MediaPage() {
  return (
    <Suspense fallback={null}>
      <MediaPageInner />
    </Suspense>
  );
}

function MediaPageInner() {
  const searchParams = useSearchParams();
  const { user, loading: authLoading, isAdmin, hasRoleScope } = useAuth();
  const canManageVideo = isAdmin || hasRoleScope("media_manager");
  const [tab, setTab] = useState("video");
  const [items, setItems] = useState([]);
  const [urls, setUrls] = useState({});
  const [loading, setLoading] = useState(true);
  const [reactions, setReactions] = useState({});

  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const [externalTitle, setExternalTitle] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [externalSubmitting, setExternalSubmitting] = useState(false);
  const [externalError, setExternalError] = useState("");

  const [youtubeVideos, setYoutubeVideos] = useState([]);
  const [youtubeError, setYoutubeError] = useState("");
  const [youtubeLoading, setYoutubeLoading] = useState(true);

  const [expandedItems, setExpandedItems] = useState([]);
  const [showOlderVideos, setShowOlderVideos] = useState(false);
  const [videoSearch, setVideoSearch] = useState("");

  function toggleExpandedItem(id) {
    setExpandedItems((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function loadYoutubeVideos() {
    setYoutubeLoading(true);
    setYoutubeError("");
    try {
      const res = await fetch("/api/youtube-videos");
      const data = await res.json();
      if (!res.ok) {
        setYoutubeError(data.error ?? "영상을 불러오지 못했어요.");
        setYoutubeVideos([]);
      } else {
        setYoutubeVideos(data.videos ?? []);
      }
    } catch {
      setYoutubeError("영상을 불러오지 못했어요.");
    }
    setYoutubeLoading(false);
  }

  async function loadItems() {
    setLoading(true);
    const { data } = await supabase
      .from("media_items")
      .select("id, title, media_type, file_path, external_url, created_at")
      .eq("media_type", tab)
      .order("created_at", { ascending: false });

    setItems(data ?? []);

    const entries = await Promise.all(
      (data ?? []).map(async (item) => {
        if (item.external_url) return [item.id, item.external_url];
        const { data: signed } = await supabase.storage
          .from("media")
          .createSignedUrl(item.file_path, 60 * 60);
        return [item.id, signed?.signedUrl ?? null];
      })
    );
    setUrls(Object.fromEntries(entries));
    setLoading(false);
    loadReactions((data ?? []).map((item) => item.id));
  }

  async function loadReactions(mediaIds) {
    if (mediaIds.length === 0) return;
    const { data, error } = await supabase
      .from("media_reactions")
      .select("media_id, user_id, reaction_type")
      .in("media_id", mediaIds);
    if (error) return;

    const grouped = {};
    for (const r of data) {
      if (!grouped[r.media_id]) grouped[r.media_id] = { counts: {}, myReaction: null };
      const entry = grouped[r.media_id];
      entry.counts[r.reaction_type] = (entry.counts[r.reaction_type] ?? 0) + 1;
      if (r.user_id === user?.id) entry.myReaction = r.reaction_type;
    }
    setReactions(grouped);
  }

  async function handleToggleReaction(mediaId, reactionType) {
    if (!user) return;
    const myReaction = reactions[mediaId]?.myReaction;

    const { error } =
      myReaction === reactionType
        ? await supabase.from("media_reactions").delete().eq("media_id", mediaId).eq("user_id", user.id)
        : await supabase
            .from("media_reactions")
            .upsert(
              { media_id: mediaId, user_id: user.id, reaction_type: reactionType },
              { onConflict: "media_id,user_id" }
            );
    if (error) {
      window.alert("처리에 실패했어요: " + error.message);
      return;
    }
    loadReactions(items.map((i) => i.id));
  }

  useEffect(() => {
    if (!user) return;
    if (tab === "youtube") {
      loadYoutubeVideos();
    } else {
      loadItems();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, tab]);

  useEffect(() => {
    const mediaId = searchParams.get("mediaId");
    if (mediaId && items.length > 0 && !expandedItems.includes(mediaId)) {
      setExpandedItems([mediaId]);
    }
  }, [searchParams, items]);

  async function pruneOldAudio() {
    const { data } = await supabase
      .from("media_items")
      .select("id, file_path")
      .eq("media_type", "audio")
      .order("created_at", { ascending: false });

    if (!data || data.length <= MAX_KEPT_AUDIO) return;

    const toDelete = data.slice(MAX_KEPT_AUDIO);
    await supabase.storage.from("media").remove(toDelete.map((d) => d.file_path));
    await supabase
      .from("media_items")
      .delete()
      .in("id", toDelete.map((d) => d.id));
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setError("");

    const path = safeStoragePath(tab, file.name);
    const { error: uploadError } = await uploadFileWithRetry("media", path, file);
    if (uploadError) {
      setUploading(false);
      setError("업로드에 실패했어요: " + uploadError.message);
      return;
    }

    const { error: insertError } = await supabase
      .from("media_items")
      .insert({ title, media_type: tab, file_path: path });

    if (insertError) {
      setUploading(false);
      setError("등록에 실패했어요: " + insertError.message);
      return;
    }

    await pruneOldAudio();

    setUploading(false);
    setTitle("");
    setFile(null);
    loadItems();
  }

  async function handleAddExternalLink(e) {
    e.preventDefault();
    if (!externalUrl.trim()) return;
    setExternalSubmitting(true);
    setExternalError("");

    const { error } = await supabase
      .from("media_items")
      .insert({ title: externalTitle, media_type: tab, external_url: externalUrl.trim() });

    if (error) {
      setExternalError("등록에 실패했어요: " + error.message);
      setExternalSubmitting(false);
      return;
    }

    setExternalSubmitting(false);
    setExternalTitle("");
    setExternalUrl("");
    loadItems();
  }

  async function handleDeleteItem(item) {
    if (!window.confirm(`"${item.title}"을(를) 삭제할까요?`)) return;
    if (item.file_path) {
      await supabase.storage.from("media").remove([item.file_path]);
    }
    const { error } = await supabase.from("media_items").delete().eq("id", item.id);
    if (error) {
      window.alert("삭제에 실패했어요: " + error.message);
      return;
    }
    loadItems();
  }

  if (!authLoading && !user) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 text-center">
        <h1 className="font-serif text-2xl font-bold text-foreground">찬양·영상</h1>
        <p className="mt-3 text-sm text-foreground/60">
          찬양팀 영상은 로그인한 교인만 볼 수 있어요.
        </p>
        <Link
          href={`/login?next=${encodeURIComponent("/media" + (searchParams.get("mediaId") ? `?mediaId=${searchParams.get("mediaId")}` : ""))}`}
          className="mt-6 inline-block rounded-full bg-brand px-4 py-2 text-sm text-white transition-colors hover:bg-brand-dark"
        >
          로그인하러 가기
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-3 pb-12">
      <h1 className="font-serif text-2xl font-bold text-foreground">찬양·영상</h1>

      <div className="mt-4 flex gap-2 border-b border-black/10 dark:border-white/10">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? "border-brand text-brand-dark"
                : "border-transparent text-foreground/50 hover:text-foreground/80"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "audio" && isAdmin && (
        <form
          key={tab}
          onSubmit={handleUpload}
          className="mt-4 space-y-3 rounded-xl border border-black/10 bg-white/60 p-5 dark:border-white/10 dark:bg-white/5"
        >
          <p className="text-sm font-medium text-foreground/80">
            {TABS.find((t) => t.key === tab)?.label} 등록
          </p>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목 (예: 2026.8.24 주일설교 - 은혜)"
            className="w-full rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/10"
          />
          <div>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground/60">
              <span className="rounded-full border border-black/10 px-3 py-1.5 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10">
                📎 음성 파일 선택
              </span>
              <input
                type="file"
                accept="audio/*"
                required
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="hidden"
              />
              {file && <span className="text-foreground/70">{file.name}</span>}
            </label>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={uploading}
            className="rounded-full bg-brand px-4 py-2 text-sm text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
          >
            {uploading ? "업로드 중..." : "등록"}
          </button>
        </form>
      )}

      {canManageVideo && tab === "video" && (
        <form
          onSubmit={handleAddExternalLink}
          className="mt-4 space-y-3 rounded-xl border border-black/10 bg-white/60 p-5 dark:border-white/10 dark:bg-white/5"
        >
          <p className="text-sm font-medium text-foreground/80">클라우드 영상 링크 추가</p>
          <p className="text-xs leading-5 text-foreground/50">
            용량이 커서 직접 업로드하기 어려운 영상은 네이버 마이박스 등에서 링크 공유 시
            &ldquo;내려받기&rdquo; 옵션을 꺼서 공유한 링크를 붙여넣으세요. 누르면 새 창에서 재생 화면이 열려요.
          </p>
          <input
            type="text"
            required
            value={externalTitle}
            onChange={(e) => setExternalTitle(e.target.value)}
            placeholder="제목 (예: 2026.8.23 찬양대 특송)"
            className="w-full rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/10"
          />
          <input
            type="url"
            required
            value={externalUrl}
            onChange={(e) => setExternalUrl(e.target.value)}
            placeholder="https://mybox.naver.com/... 공유 링크"
            className="w-full rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/10"
          />
          {externalError && <p className="text-sm text-red-600">{externalError}</p>}
          <button
            type="submit"
            disabled={externalSubmitting}
            className="rounded-full bg-brand px-4 py-2 text-sm text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
          >
            {externalSubmitting ? "등록 중..." : "링크 등록"}
          </button>
        </form>
      )}

      {tab === "audio" ? (
        <div className="mt-6">
          {!isAdmin ? null : (
            <>
              {loading && <p className="text-sm text-foreground/50">불러오는 중...</p>}
              {!loading && items.length === 0 && (
                <p className="text-sm text-foreground/50">아직 등록된 설교가 없어요.</p>
              )}
              {!loading && items.length > 0 && (
            <>
              <div className="rounded-xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-medium text-brand-dark">이번 주 설교</p>
                  {isAdmin && (
                    <button
                      onClick={() => handleDeleteItem(items[0])}
                      className="shrink-0 text-xs text-foreground/40 hover:text-red-600"
                    >
                      삭제
                    </button>
                  )}
                </div>
                <p className="mt-1 font-medium text-foreground">{items[0].title}</p>
                <p className="mt-1 text-xs text-foreground/40">
                  {new Date(items[0].created_at).toLocaleDateString("ko-KR")}
                </p>
                {urls[items[0].id] ? (
                  <audio controls className="mt-3 w-full" src={urls[items[0].id]} />
                ) : (
                  <p className="mt-2 text-xs text-foreground/40">재생 링크를 불러오는 중...</p>
                )}
              </div>

              {items.length > 1 && (
                <div className="mt-6 border-t border-black/10 pt-6 dark:border-white/10">
                  <h2 className="font-serif text-lg font-semibold text-foreground">지난 설교</h2>
                  <ul className="mt-3 divide-y divide-black/10 rounded-xl border border-black/10 bg-white/60 dark:divide-white/10 dark:border-white/10 dark:bg-white/5">
                    {items.slice(1).map((item) => (
                      <li key={item.id}>
                        <div className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-black/5 dark:hover:bg-white/10">
                          <button
                            onClick={() => toggleExpandedItem(item.id)}
                            className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left"
                          >
                            <span className="min-w-0 truncate">
                              <span className="font-medium text-foreground">{item.title}</span>
                              <span className="ml-2 text-xs text-foreground/40">
                                {new Date(item.created_at).toLocaleDateString("ko-KR")}
                              </span>
                            </span>
                            <span className="shrink-0 text-foreground/40">
                              {expandedItems.includes(item.id) ? "숨기기" : "듣기"}
                            </span>
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteItem(item)}
                              className="shrink-0 text-xs text-foreground/40 hover:text-red-600"
                            >
                              삭제
                            </button>
                          )}
                        </div>
                        {expandedItems.includes(item.id) && (
                          <div className="px-4 pb-4">
                            {urls[item.id] ? (
                              <audio controls className="w-full" src={urls[item.id]} />
                            ) : (
                              <p className="text-xs text-foreground/40">재생 링크를 불러오는 중...</p>
                            )}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
              )}
            </>
          )}
        </div>
      ) : tab === "youtube" ? (
        <div className="mt-6">
          {youtubeLoading && <p className="text-sm text-foreground/50">불러오는 중...</p>}
          {!youtubeLoading && youtubeError && (
            <p className="text-sm text-red-600">{youtubeError}</p>
          )}
          {!youtubeLoading && !youtubeError && youtubeVideos.length === 0 && (
            <p className="text-sm text-foreground/50">불러올 영상이 없어요.</p>
          )}
          <ul className="grid gap-4 sm:grid-cols-2">
            {youtubeVideos.map((v) => (
              <li key={v.id}>
                <a
                  href={`https://www.youtube.com/watch?v=${v.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block overflow-hidden rounded-xl border border-black/10 bg-white/60 transition-colors hover:bg-black/5 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                >
                  {v.thumbnail && (
                    <img src={v.thumbnail} alt={v.title} className="w-full object-cover" />
                  )}
                  <div className="p-3">
                    <p className="text-sm font-medium text-foreground">{v.title}</p>
                    <p className="mt-1 text-xs text-foreground/40">
                      {new Date(v.publishedAt).toLocaleDateString("ko-KR")}
                    </p>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : (
      <>
      {tab === "video" && items.length > 0 && (
        <input
          type="text"
          value={videoSearch}
          onChange={(e) => setVideoSearch(e.target.value)}
          placeholder="제목으로 검색"
          className="mt-6 w-full rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/10"
        />
      )}
      <ul className={`space-y-4 ${tab === "video" && items.length > 0 ? "mt-3" : "mt-6"}`}>
        {loading && <li className="text-sm text-foreground/50">불러오는 중...</li>}
        {!loading && items.length === 0 && (
          <li className="text-sm text-foreground/50">아직 등록된 콘텐츠가 없어요.</li>
        )}
        {(() => {
          if (tab !== "video") return items;
          const isSearching = videoSearch.trim() !== "";
          const filtered = isSearching
            ? items.filter((i) => i.title?.toLowerCase().includes(videoSearch.trim().toLowerCase()))
            : items;
          if (isSearching) return filtered;
          if (showOlderVideos) return canManageVideo ? filtered : filtered.slice(0, 3);
          return filtered.slice(0, 1);
        })().map((item) => (
          <li
            key={item.id}
            className="rounded-xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium text-foreground">{item.title}</p>
              {canManageVideo && (
                <button
                  onClick={() => handleDeleteItem(item)}
                  className="shrink-0 text-xs text-foreground/40 hover:text-red-600"
                >
                  삭제
                </button>
              )}
            </div>
            <p className="mt-1 text-xs text-foreground/40">
              {new Date(item.created_at).toLocaleDateString("ko-KR")}
            </p>
            {!urls[item.id] ? (
              <p className="mt-2 text-xs text-foreground/40">재생 링크를 불러오는 중...</p>
            ) : item.external_url ? (
              <div className="mt-3 flex items-center gap-2">
                <a
                  href={urls[item.id]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm text-white transition-colors hover:bg-brand-dark"
                >
                  ▶ 재생하기 (새 창에서 열림)
                </a>
                <KakaoShareButton
                  title={item.title}
                  description={`${item.title} · ${new Date(item.created_at).toLocaleDateString("ko-KR")}`}
                  url={`${typeof window !== "undefined" ? window.location.origin : ""}/media?mediaId=${item.id}`}
                  size="small"
                />
              </div>
            ) : (
              <video controls className="mt-3 w-full rounded-lg" src={urls[item.id]} />
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {REACTIONS.filter((r) => r.key !== "comfort").map((r) => {
                const count = reactions[item.id]?.counts?.[r.key] ?? 0;
                const mine = reactions[item.id]?.myReaction === r.key;
                return (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => handleToggleReaction(item.id, r.key)}
                    disabled={!user}
                    title={r.label}
                    className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors disabled:opacity-50 ${
                      mine
                        ? "border-brand bg-brand-tint text-brand-dark"
                        : "border-black/10 text-foreground/70 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
                    }`}
                  >
                    {r.emoji} {count > 0 ? count : ""}
                  </button>
                );
              })}
            </div>
          </li>
        ))}
        {tab === "video" && videoSearch.trim() === "" && items.length > 1 && (
          <li>
            <button
              type="button"
              onClick={() => setShowOlderVideos((v) => !v)}
              className="w-full rounded-xl border border-black/10 py-2 text-sm text-foreground/60 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
            >
              {showOlderVideos
                ? "접기"
                : `지난 영상 보기 (${canManageVideo ? items.length - 1 : Math.min(items.length - 1, 2)})`}
            </button>
          </li>
        )}
      </ul>
      </>
      )}
    </main>
  );
}
