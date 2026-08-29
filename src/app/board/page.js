"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { safeStoragePath } from "@/lib/storagePath";
import KakaoShareButton from "@/components/KakaoShareButton";
import { DISTRICT_NAMES } from "@/lib/teamRoster";
import { titleBadgeClass } from "@/lib/memberTitle";
import { avatarUrl } from "@/lib/avatar";
import AvatarLightbox from "@/components/AvatarLightbox";

const CATEGORIES = [
  { key: "district", label: "구역게시판" },
  { key: "prayer", label: "기도게시판" },
  { key: "share", label: "나눔게시판" },
  { key: "help", label: "앱사용문의", emphasize: true },
];

const DEFAULT_CATEGORY = "help";

const DISTRICT_BOARD_TABS = [
  { key: "notice", label: "구역공지" },
  { key: "general", label: "구역이야기" },
];
const DEFAULT_DISTRICT_BOARD_TYPE = "general";

// 구역게시판에서 다루는 소속 목록. 정식 "구역"(teamRoster.districts)에
// 청년부를 게시판 전용으로 추가한 목록 — 제직명단 구역 편성표에는 영향 없음.
const BOARD_DISTRICTS = [...DISTRICT_NAMES, "청년부"];

const REACTIONS = [
  { key: "like", emoji: "❤️", label: "좋아요" },
  { key: "pray", emoji: "🙏", label: "기도해요" },
  { key: "grace", emoji: "😊", label: "은혜돼요" },
  { key: "agree", emoji: "👍", label: "공감" },
  { key: "comfort", emoji: "😢", label: "위로해요" },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const IMAGE_EXTENSIONS = /\.(jpe?g|png|gif|webp|avif|bmp|svg)$/i;
function isImageAttachment(name) {
  return !!name && IMAGE_EXTENSIONS.test(name);
}

export default function BoardPage() {
  const {
    user,
    loading: authLoading,
    isAdmin,
    isBoardAdmin,
    district: myDistrict,
    memberTitle,
    markBoardSeen,
  } = useAuth();
  const [category, setCategory] = useState(DEFAULT_CATEGORY);
  const [districtView, setDistrictView] = useState(null);
  const [districtBoardType, setDistrictBoardType] = useState(DEFAULT_DISTRICT_BOARD_TYPE);
  const resolvedDistrictView =
    districtView ?? (BOARD_DISTRICTS.includes(myDistrict) ? myDistrict : BOARD_DISTRICTS[0]);
  const activeDistrict =
    category === "district" ? (isAdmin ? resolvedDistrictView : myDistrict) : null;
  const activeBoardType = category === "district" ? districtBoardType : DEFAULT_DISTRICT_BOARD_TYPE;
  const canUseDistrictBoard =
    category !== "district" || isAdmin || BOARD_DISTRICTS.includes(myDistrict);
  const canWriteDistrictNotice = isAdmin || isBoardAdmin;
  const canWriteInCurrentBoard =
    category !== "district" || districtBoardType !== "notice" || canWriteDistrictNotice;
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [comments, setComments] = useState({});
  const [expandedPosts, setExpandedPosts] = useState([]);
  const [commentInputs, setCommentInputs] = useState({});
  const [commentSubmitting, setCommentSubmitting] = useState(null);

  const [likes, setLikes] = useState({});
  const [likeSubmitting, setLikeSubmitting] = useState(null);
  const [likeDetailOpen, setLikeDetailOpen] = useState([]);
  const [memberNames, setMemberNames] = useState({});

  const [avatars, setAvatars] = useState({});
  const [lightboxUrl, setLightboxUrl] = useState(null);

  const [editingPostId, setEditingPostId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  async function loadPosts(cat, districtFilter, boardType) {
    if (cat === "district" && !districtFilter) {
      setPosts([]);
      setComments({});
      setLikes({});
      setLoadingPosts(false);
      return;
    }

    setLoadingPosts(true);
    let query = supabase
      .from("posts")
      .select(
        "id, title, body, author_name, author_title, created_at, attachment_url, attachment_name, user_id, is_pinned"
      )
      .eq("category", cat)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });
    if (cat === "district") {
      query = query.eq("district", districtFilter).eq("board_type", boardType);
    }
    const { data, error } = await query;

    if (!error) setPosts(data);
    setLoadingPosts(false);

    if (!error && data?.length > 0) {
      loadComments(data.map((p) => p.id));
      loadLikes(data.map((p) => p.id));
      loadAvatarsFor(data.map((p) => p.user_id));
    } else {
      setComments({});
      setLikes({});
    }
  }

  async function loadAvatarsFor(userIds) {
    const missing = [...new Set(userIds)].filter((id) => id && !(id in avatars));
    if (missing.length === 0) return;
    const { data } = await supabase
      .from("member_directory")
      .select("id, avatar_path")
      .in("id", missing);
    setAvatars((prev) => {
      const next = { ...prev };
      for (const id of missing) next[id] = null;
      for (const row of data ?? []) next[row.id] = row.avatar_path;
      return next;
    });
  }

  async function loadLikes(postIds) {
    const { data, error } = await supabase
      .from("post_likes")
      .select("post_id, user_id, reaction_type")
      .in("post_id", postIds);

    if (error) return;

    const grouped = {};
    for (const l of data) {
      if (!grouped[l.post_id]) grouped[l.post_id] = { counts: {}, users: {}, myReaction: null };
      const entry = grouped[l.post_id];
      entry.counts[l.reaction_type] = (entry.counts[l.reaction_type] ?? 0) + 1;
      (entry.users[l.reaction_type] ??= []).push(l.user_id);
      if (l.user_id === user?.id) entry.myReaction = l.reaction_type;
    }
    setLikes(grouped);
  }

  // 관리자가 "반응한 회원 보기"를 눌렀을 때만 이름을 조회한다 (일반 회원에겐 불필요한 조회).
  async function loadNamesFor(userIds) {
    const missing = [...new Set(userIds)].filter((id) => id && !(id in memberNames));
    if (missing.length === 0) return;
    const { data } = await supabase
      .from("member_directory")
      .select("id, display_name")
      .in("id", missing);
    setMemberNames((prev) => {
      const next = { ...prev };
      for (const id of missing) next[id] = "알 수 없음";
      for (const row of data ?? []) next[row.id] = row.display_name;
      return next;
    });
  }

  function toggleLikeDetail(postId) {
    setLikeDetailOpen((prev) =>
      prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId]
    );
    loadNamesFor(Object.values(likes[postId]?.users ?? {}).flat());
  }

  async function handleToggleLike(postId, reactionType) {
    if (!user) return;
    setLikeSubmitting(postId);
    const myReaction = likes[postId]?.myReaction;

    const { error } =
      myReaction === reactionType
        ? await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", user.id)
        : await supabase
            .from("post_likes")
            .upsert(
              { post_id: postId, user_id: user.id, reaction_type: reactionType },
              { onConflict: "post_id,user_id" }
            );

    setLikeSubmitting(null);
    if (error) {
      window.alert("처리에 실패했어요: " + error.message);
      return;
    }
    loadLikes(posts.map((p) => p.id));
  }

  async function loadComments(postIds) {
    const { data, error } = await supabase
      .from("comments")
      .select("id, post_id, user_id, author_name, author_title, body, created_at")
      .in("post_id", postIds)
      .order("created_at", { ascending: true });

    if (error) return;

    const grouped = {};
    for (const c of data) {
      if (!grouped[c.post_id]) grouped[c.post_id] = [];
      grouped[c.post_id].push(c);
    }
    setComments(grouped);
    loadAvatarsFor(data.map((c) => c.user_id));
  }

  function toggleExpanded(postId) {
    setExpandedPosts((prev) =>
      prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId]
    );
  }

  async function handleAddComment(e, postId) {
    e.preventDefault();
    const text = (commentInputs[postId] ?? "").trim();
    if (!text) return;

    setCommentSubmitting(postId);
    const authorName = user.user_metadata?.display_name || user.email;
    const { error } = await supabase.from("comments").insert({
      post_id: postId,
      user_id: user.id,
      author_name: authorName,
      author_title: memberTitle || null,
      body: text,
    });
    setCommentSubmitting(null);

    if (error) {
      window.alert("댓글 등록에 실패했어요: " + error.message);
      return;
    }
    setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
    loadComments(posts.map((p) => p.id));
  }

  async function handleDeleteComment(commentId) {
    if (!window.confirm("이 댓글을 삭제할까요?")) return;
    const { error } = await supabase.from("comments").delete().eq("id", commentId);
    if (error) {
      window.alert("삭제에 실패했어요: " + error.message);
      return;
    }
    loadComments(posts.map((p) => p.id));
  }

  useEffect(() => {
    loadPosts(category, activeDistrict, activeBoardType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, activeDistrict, activeBoardType]);

  useEffect(() => {
    markBoardSeen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      const path = safeStoragePath(user.id, file.name);
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
      author_title: memberTitle || null,
      category,
      district: activeDistrict,
      board_type: activeBoardType,
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
    loadPosts(category, activeDistrict, activeBoardType);
  }

  async function togglePin(post) {
    const { error } = await supabase
      .from("posts")
      .update({ is_pinned: !post.is_pinned })
      .eq("id", post.id);
    if (error) {
      window.alert("고정 처리에 실패했어요: " + error.message);
      return;
    }
    loadPosts(category, activeDistrict, activeBoardType);
  }

  async function handleDelete(postId) {
    if (!window.confirm("이 글을 삭제할까요?")) return;
    const { error } = await supabase.from("posts").delete().eq("id", postId);
    if (error) {
      window.alert("삭제에 실패했어요: " + error.message);
      return;
    }
    loadPosts(category, activeDistrict, activeBoardType);
  }

  function startEditPost(post) {
    setEditingPostId(post.id);
    setEditTitle(post.title);
    setEditBody(post.body);
  }

  function cancelEditPost() {
    setEditingPostId(null);
    setEditTitle("");
    setEditBody("");
  }

  async function handleEditSave(postId) {
    if (!editTitle.trim() || !editBody.trim()) return;
    setEditSubmitting(true);
    const { error } = await supabase
      .from("posts")
      .update({ title: editTitle, body: editBody })
      .eq("id", postId);
    setEditSubmitting(false);

    if (error) {
      window.alert("수정에 실패했어요: " + error.message);
      return;
    }
    cancelEditPost();
    loadPosts(category, activeDistrict, activeBoardType);
  }

  if (!authLoading && !user) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 text-center">
        <h1 className="font-serif text-2xl font-bold text-foreground">게시판</h1>
        <p className="mt-3 text-sm text-foreground/60">게시판은 로그인한 교인만 볼 수 있어요.</p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-full bg-brand px-4 py-2 text-sm text-white transition-colors hover:bg-brand-dark"
        >
          로그인하러 가기
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 mt-3 pb-12">
      <h1 className="font-serif text-2xl font-bold text-foreground">게시판</h1>

      <div className="mt-2 flex items-center gap-2 border-b border-black/10 dark:border-white/10">
        {CATEGORIES.map((c) =>
          c.emphasize ? (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              className={`-mb-px rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                category === c.key ? "bg-brand-dark text-white" : "bg-brand text-white hover:bg-brand-dark"
              }`}
            >
              {c.label}
            </button>
          ) : (
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
          )
        )}
      </div>

      {category === "district" && (
        <div className="mt-4 flex gap-2">
          {DISTRICT_BOARD_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setDistrictBoardType(t.key)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                districtBoardType === t.key
                  ? "bg-brand text-white"
                  : "bg-black/5 text-foreground/60 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {category === "district" && user && isAdmin && (
        <div className="mt-4 flex items-center gap-2 text-sm">
          <label className="text-foreground/60">구역 선택</label>
          <select
            value={resolvedDistrictView}
            onChange={(e) => setDistrictView(e.target.value)}
            className="rounded-md border border-black/10 px-2 py-1 text-sm dark:border-white/10 dark:bg-white/10"
          >
            {BOARD_DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-col">
      <div className={posts.length > 0 ? "order-2" : "order-1"}>
      {category === "district" && user && !isAdmin && !canUseDistrictBoard && (
        <p className="mt-4 text-sm text-foreground/50">
          소속 구역이 지정되지 않아 구역게시판을 이용할 수 없어요. 관리자에게 문의해주세요.
        </p>
      )}

      {category === "district" && user && canUseDistrictBoard && !canWriteInCurrentBoard && (
        <p className="mt-4 text-sm text-foreground/50">
          구역공지는 구역장(관리자)만 작성할 수 있어요.
        </p>
      )}

      {user && canUseDistrictBoard && canWriteInCurrentBoard && (
        <form
          key={`${category}-${districtBoardType}`}
          onSubmit={handleSubmit}
          className="mt-4 space-y-3 rounded-xl border border-black/10 bg-white/60 p-5 dark:border-white/10 dark:bg-white/5"
        >
          {category === "district" && (
            <p className="text-xs text-foreground/50">
              {districtBoardType === "notice"
                ? `${activeDistrict} 구역원 전체에게 공지로 보여요.`
                : `${activeDistrict} 구역원에게만 보이는 글이에요.`}
            </p>
          )}
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
      </div>

      <div className={posts.length > 0 ? "order-1" : "order-2"}>
      <ul className="mt-4 divide-y divide-black/10 rounded-xl border border-black/10 bg-white/60 dark:divide-white/10 dark:border-white/10 dark:bg-white/5">
        {loadingPosts && <li className="p-4 text-sm text-foreground/50">불러오는 중...</li>}
        {!loadingPosts && posts.length === 0 && (
          <li className="p-4 text-sm text-foreground/50">아직 등록된 글이 없어요.</li>
        )}
        {posts.map((post) => (
          <li
            key={post.id}
            className={`p-4 ${post.is_pinned ? "bg-brand-tint/50 dark:bg-brand-tint/10" : ""}`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium text-foreground">
                {post.is_pinned && (
                  <span className="mr-1.5 rounded-full bg-brand px-2 py-0.5 text-xs font-medium text-white">
                    📌 공지
                  </span>
                )}
                {editingPostId !== post.id && post.title}
              </p>
              {editingPostId !== post.id && (
                <div className="flex shrink-0 items-center gap-2">
                  {(isAdmin || isBoardAdmin) && (
                    <button
                      onClick={() => togglePin(post)}
                      className="text-xs text-foreground/40 hover:text-brand-dark"
                    >
                      {post.is_pinned ? "고정 해제" : "고정"}
                    </button>
                  )}
                  {(isAdmin || isBoardAdmin || post.user_id === user?.id) && (
                    <button
                      onClick={() => startEditPost(post)}
                      className="text-xs text-foreground/40 hover:text-brand-dark"
                    >
                      수정
                    </button>
                  )}
                  {(isAdmin || isBoardAdmin || post.user_id === user?.id) && (
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="text-xs text-foreground/40 hover:text-red-600"
                    >
                      삭제
                    </button>
                  )}
                </div>
              )}
            </div>
            {editingPostId === post.id ? (
              <div className="mt-2 space-y-2">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/10"
                />
                <textarea
                  rows={3}
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  className="w-full rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/10"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditSave(post.id)}
                    disabled={editSubmitting}
                    className="rounded-full bg-brand px-4 py-1.5 text-xs text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
                  >
                    {editSubmitting ? "저장 중..." : "저장"}
                  </button>
                  <button
                    onClick={cancelEditPost}
                    className="rounded-full border border-black/10 px-4 py-1.5 text-xs text-foreground/60 transition-colors hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <p className="mt-1 text-sm whitespace-pre-line text-foreground/70">{post.body}</p>
            )}
            {post.attachment_url && isImageAttachment(post.attachment_name) ? (
              <a
                href={post.attachment_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 block w-fit"
              >
                <img
                  src={post.attachment_url}
                  alt={post.attachment_name}
                  className="max-h-64 max-w-full rounded-lg border border-black/10 object-contain dark:border-white/10"
                />
              </a>
            ) : (
              post.attachment_url && (
                <a
                  href={post.attachment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-sm text-brand-dark underline"
                >
                  📎 {post.attachment_name}
                </a>
              )
            )}
            <p className="mt-2 flex items-center gap-1.5 text-xs text-foreground/50">
              {avatarUrl(avatars[post.user_id]) ? (
                <img
                  src={avatarUrl(avatars[post.user_id])}
                  alt=""
                  onClick={() => setLightboxUrl(avatarUrl(avatars[post.user_id]))}
                  className="h-5 w-5 shrink-0 cursor-pointer rounded-full object-cover"
                />
              ) : (
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-black/5 text-[10px] dark:bg-white/10">
                  🙂
                </span>
              )}
              <span>
                {post.author_name}
                {post.author_title && (
                  <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${titleBadgeClass(post.author_title)}`}>
                    {post.author_title}
                  </span>
                )}{" "}
                · {new Date(post.created_at).toLocaleDateString("ko-KR")}
              </span>
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              {REACTIONS.map((r) => {
                const count = likes[post.id]?.counts?.[r.key] ?? 0;
                const mine = likes[post.id]?.myReaction === r.key;
                return (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => handleToggleLike(post.id, r.key)}
                    disabled={!user || likeSubmitting === post.id}
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
              <KakaoShareButton
                title={post.title}
                description={post.body}
                url="https://ggnch.shop/board"
              />
            </div>

            {isAdmin && Object.values(likes[post.id]?.counts ?? {}).some((c) => c > 0) && (
              <button
                type="button"
                onClick={() => toggleLikeDetail(post.id)}
                className="mt-1.5 text-xs text-foreground/40 underline"
              >
                반응한 회원 {likeDetailOpen.includes(post.id) ? "숨기기" : "보기"}
              </button>
            )}

            {isAdmin && likeDetailOpen.includes(post.id) && (
              <div className="mt-1.5 space-y-1 rounded-lg bg-black/5 p-2 text-xs text-foreground/60 dark:bg-white/10">
                {REACTIONS.filter((r) => (likes[post.id]?.counts?.[r.key] ?? 0) > 0).map((r) => (
                  <p key={r.key}>
                    {r.emoji} {r.label}:{" "}
                    {(likes[post.id]?.users?.[r.key] ?? [])
                      .map((uid) => memberNames[uid] ?? "불러오는 중...")
                      .join(", ")}
                  </p>
                ))}
              </div>
            )}

            <button
              onClick={() => toggleExpanded(post.id)}
              className="mt-3 text-xs font-medium text-brand-dark"
            >
              💬 댓글 {comments[post.id]?.length ?? 0}개{" "}
              {expandedPosts.includes(post.id) ? "숨기기" : "보기"}
            </button>

            {expandedPosts.includes(post.id) && (
              <div className="mt-2 space-y-2 border-t border-black/10 pt-3 dark:border-white/10">
                {(comments[post.id] ?? []).map((c) => (
                  <div key={c.id} className="flex items-start justify-between gap-2 text-sm">
                    <div>
                      <p className="text-foreground/80">{c.body}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-foreground/40">
                        {avatarUrl(avatars[c.user_id]) ? (
                          <img
                            src={avatarUrl(avatars[c.user_id])}
                            alt=""
                            onClick={() => setLightboxUrl(avatarUrl(avatars[c.user_id]))}
                            className="h-4 w-4 shrink-0 cursor-pointer rounded-full object-cover"
                          />
                        ) : (
                          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-black/5 text-[9px] dark:bg-white/10">
                            🙂
                          </span>
                        )}
                        <span>
                          {c.author_name}
                          {c.author_title && (
                            <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${titleBadgeClass(c.author_title)}`}>
                              {c.author_title}
                            </span>
                          )}{" "}
                          · {new Date(c.created_at).toLocaleDateString("ko-KR")}
                        </span>
                      </p>
                    </div>
                    {(isAdmin || isBoardAdmin || c.user_id === user?.id) && (
                      <button
                        onClick={() => handleDeleteComment(c.id)}
                        className="shrink-0 text-xs text-foreground/40 hover:text-red-600"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                ))}
                {(comments[post.id] ?? []).length === 0 && (
                  <p className="text-xs text-foreground/40">아직 댓글이 없어요.</p>
                )}

                {user && (
                  <form
                    onSubmit={(e) => handleAddComment(e, post.id)}
                    className="mt-2 flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={commentInputs[post.id] ?? ""}
                      onChange={(e) =>
                        setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                      }
                      placeholder="댓글을 입력하세요"
                      className="flex-1 rounded-md border border-black/10 px-3 py-1.5 text-sm dark:border-white/10 dark:bg-white/10"
                    />
                    <button
                      type="submit"
                      disabled={commentSubmitting === post.id}
                      className="shrink-0 rounded-full bg-brand px-3 py-1.5 text-xs text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
                    >
                      등록
                    </button>
                  </form>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
      </div>
      </div>

      <AvatarLightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
    </main>
  );
}
