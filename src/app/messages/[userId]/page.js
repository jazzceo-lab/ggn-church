"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { titleBadgeClass } from "@/lib/memberTitle";
import { avatarUrl } from "@/lib/avatar";
import { safeStoragePath } from "@/lib/storagePath";
import { uploadFileWithRetry } from "@/lib/uploadWithRetry";
import { resizeImageFile } from "@/lib/resizeImage";
import { isImageAttachment } from "@/lib/attachment";
import { REACTIONS } from "@/lib/reactions";
import { loadMessageReactions, toggleMessageReaction } from "@/lib/messageReactions";
import { loadMessageBookmarks, toggleMessageBookmark } from "@/lib/messageBookmarks";
import AvatarLightbox from "@/components/AvatarLightbox";
import MessageActionSheet from "@/components/MessageActionSheet";
import ForwardPicker from "@/components/ForwardPicker";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function ConversationPage() {
  const { userId } = useParams();
  const { user, loading: authLoading, refreshUnreadCount } = useAuth();
  const [partnerName, setPartnerName] = useState("");
  const [partnerTitle, setPartnerTitle] = useState(null);
  const [partnerAvatarPath, setPartnerAvatarPath] = useState(null);
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const [thread, setThread] = useState([]);
  const [body, setBody] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [readError, setReadError] = useState("");
  const [reactions, setReactions] = useState({});
  const [bookmarks, setBookmarks] = useState(new Set());
  const [activeMessage, setActiveMessage] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [forwardContent, setForwardContent] = useState(null);
  const bottomRef = useRef(null);
  const longPressTimer = useRef(null);

  function startLongPress(m) {
    longPressTimer.current = setTimeout(() => setActiveMessage(m), 450);
  }

  function cancelLongPress() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  async function loadThread() {
    if (!user) return;
    setLoading(true);

    const { data: partner } = await supabase
      .from("member_directory")
      .select("display_name, title, avatar_path")
      .eq("id", userId)
      .single();
    setPartnerName(partner?.display_name ?? "알 수 없음");
    setPartnerTitle(partner?.title ?? null);
    setPartnerAvatarPath(partner?.avatar_path ?? null);

    const { data } = await supabase
      .from("messages")
      .select("id, sender_id, recipient_id, body, created_at, read_at, attachment_url, attachment_name, reply_to_id")
      .or(
        `and(sender_id.eq.${user.id},recipient_id.eq.${userId}),and(sender_id.eq.${userId},recipient_id.eq.${user.id})`
      )
      .order("created_at", { ascending: true });

    setThread(data ?? []);
    setLoading(false);

    const ids = (data ?? []).map((m) => m.id);
    loadMessageReactions("dm", ids, user.id).then(setReactions);
    loadMessageBookmarks("dm", ids, user.id).then(setBookmarks);

    const { error: markReadError } = await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("sender_id", userId)
      .eq("recipient_id", user.id)
      .is("read_at", null);
    if (markReadError) {
      console.error("읽음 처리 실패:", markReadError.message);
      setReadError(markReadError.message);
    }
    refreshUnreadCount();
  }

  useEffect(() => {
    loadThread();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userId]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`conversation-${user.id}-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `recipient_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new.sender_id !== userId) return;
          setThread((prev) => [...prev, payload.new]);
          supabase
            .from("messages")
            .update({ read_at: new Date().toISOString() })
            .eq("id", payload.new.id)
            .then(({ error: markReadError }) => {
              if (markReadError) {
                console.error("읽음 처리 실패:", markReadError.message);
                setReadError(markReadError.message);
              }
              refreshUnreadCount();
            });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `sender_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new.recipient_id !== userId) return;
          setThread((prev) =>
            prev.map((m) => (m.id === payload.new.id ? { ...m, read_at: payload.new.read_at } : m))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "nearest" });
  }, [thread]);

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

  async function handleSend(e) {
    e.preventDefault();
    if (!body.trim() && !file) return;
    setSending(true);
    setError("");

    let attachmentUrl = null;
    let attachmentName = null;

    if (file) {
      const uploadFile = file.type.startsWith("image/")
        ? await resizeImageFile(file, { maxSize: 1600 })
        : file;
      const path = safeStoragePath(user.id, uploadFile.name);
      const { error: uploadError } = await uploadFileWithRetry("attachments", path, uploadFile);

      if (uploadError) {
        setSending(false);
        setError("파일 업로드에 실패했어요: " + uploadError.message);
        return;
      }
      attachmentUrl = supabase.storage.from("attachments").getPublicUrl(path).data.publicUrl;
      attachmentName = uploadFile.name;
    }

    const { error } = await supabase.from("messages").insert({
      sender_id: user.id,
      recipient_id: userId,
      body,
      attachment_url: attachmentUrl,
      attachment_name: attachmentName,
      reply_to_id: replyingTo?.id ?? null,
    });

    setSending(false);
    if (error) {
      setError("전송에 실패했어요: " + error.message);
      return;
    }
    setBody("");
    setFile(null);
    setReplyingTo(null);
    loadThread();
  }

  async function handleReact(reactionType) {
    if (!activeMessage) return;
    const myReaction = reactions[activeMessage.id]?.myReaction ?? null;
    await toggleMessageReaction("dm", activeMessage.id, user.id, myReaction, reactionType);
    setActiveMessage(null);
    const ids = thread.map((m) => m.id);
    loadMessageReactions("dm", ids, user.id).then(setReactions);
  }

  async function handleToggleBookmark() {
    if (!activeMessage) return;
    const bookmarked = bookmarks.has(activeMessage.id);
    await toggleMessageBookmark("dm", activeMessage.id, user.id, bookmarked);
    setActiveMessage(null);
    const ids = thread.map((m) => m.id);
    loadMessageBookmarks("dm", ids, user.id).then(setBookmarks);
  }

  function handleCopy() {
    if (activeMessage?.body) navigator.clipboard?.writeText(activeMessage.body);
    setActiveMessage(null);
  }

  function handleReply() {
    setReplyingTo(activeMessage);
    setActiveMessage(null);
  }

  function handleForward() {
    setForwardContent({
      body: activeMessage.body,
      attachment_url: activeMessage.attachment_url,
      attachment_name: activeMessage.attachment_name,
    });
    setActiveMessage(null);
  }

  async function handleDeleteMessage(id) {
    if (!window.confirm("이 채팅을 삭제할까요?")) return;
    const { error } = await supabase.from("messages").delete().eq("id", id);
    if (error) {
      window.alert("삭제에 실패했어요: " + error.message);
      return;
    }
    setThread((prev) => prev.filter((m) => m.id !== id));
    refreshUnreadCount();
  }

  if (!authLoading && !user) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 text-center">
        <p className="text-sm text-foreground/60">로그인이 필요해요.</p>
        <Link href="/login" className="mt-4 inline-block text-brand-dark underline">
          로그인하러 가기
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pt-3 pb-12">
      <div className="flex items-center gap-3">
        <Link href="/messages" className="text-sm text-foreground/50 hover:underline">
          ← GGN톡
        </Link>
        {avatarUrl(partnerAvatarPath) ? (
          <img
            src={avatarUrl(partnerAvatarPath)}
            alt=""
            onClick={() => setLightboxUrl(avatarUrl(partnerAvatarPath))}
            className="h-8 w-8 shrink-0 cursor-pointer rounded-full object-cover"
          />
        ) : (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/5 text-sm dark:bg-white/10">
            🙂
          </span>
        )}
        <h1 className="flex items-center gap-1.5 font-serif text-xl font-bold text-foreground">
          {partnerName}
          {partnerTitle && (
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${titleBadgeClass(partnerTitle)}`}>
              {partnerTitle}
            </span>
          )}
        </h1>
      </div>

      {readError && (
        <p className="mt-2 text-xs text-red-600">읽음 처리 실패: {readError}</p>
      )}

      <div className="mt-4 flex-1 space-y-3 rounded-xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
        {loading && <p className="text-sm text-foreground/50">불러오는 중...</p>}
        {!loading && thread.length === 0 && (
          <p className="text-sm text-foreground/50">아직 나눈 채팅이 없어요. 먼저 인사해보세요!</p>
        )}
        {thread.map((m) => {
          const mine = m.sender_id === user?.id;
          const repliedTo = m.reply_to_id ? thread.find((t) => t.id === m.reply_to_id) : null;
          const myReaction = reactions[m.id]?.myReaction;
          const counts = reactions[m.id]?.counts ?? {};
          const hasReactions = Object.values(counts).some((c) => c > 0);
          return (
            <div key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
              <div className={`flex items-end gap-1 ${mine ? "justify-end" : "justify-start"}`}>
                {mine && !m.read_at && (
                  <button
                    onClick={() => handleDeleteMessage(m.id)}
                    className="text-xs text-foreground/30 hover:text-red-600"
                  >
                    삭제
                  </button>
                )}
                <button
                  onClick={() => setActiveMessage(m)}
                  className="text-xs text-foreground/30 hover:text-foreground/60"
                  aria-label="더보기"
                  title="더보기"
                >
                  ⋯
                </button>
                <div
                  onTouchStart={() => startLongPress(m)}
                  onTouchEnd={cancelLongPress}
                  onTouchMove={cancelLongPress}
                  onContextMenu={(e) => e.preventDefault()}
                  onMouseDown={() => startLongPress(m)}
                  onMouseUp={cancelLongPress}
                  onMouseLeave={cancelLongPress}
                  className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                    mine ? "bg-brand text-white" : "bg-black/5 text-foreground dark:bg-white/10"
                  }`}
                >
                  {repliedTo && (
                    <p
                      className={`mb-1 truncate border-l-2 pl-2 text-xs ${
                        mine ? "border-white/40 text-white/70" : "border-black/20 text-foreground/50"
                      }`}
                    >
                      {repliedTo.body || (repliedTo.attachment_name ? `📎 ${repliedTo.attachment_name}` : "삭제된 메시지")}
                    </p>
                  )}
                  {m.body && <p className="whitespace-pre-wrap">{m.body}</p>}
                  {m.attachment_url && isImageAttachment(m.attachment_name) ? (
                    <a href={m.attachment_url} target="_blank" rel="noopener noreferrer" className="mt-1 block w-fit">
                      <img
                        src={m.attachment_url}
                        alt={m.attachment_name}
                        className="max-h-48 max-w-full rounded-lg object-contain"
                      />
                    </a>
                  ) : (
                    m.attachment_url && (
                      <a
                        href={m.attachment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`mt-1 inline-flex items-center gap-1 text-sm underline ${
                          mine ? "text-white" : "text-brand-dark"
                        }`}
                      >
                        📎 {m.attachment_name}
                      </a>
                    )
                  )}
                  <p
                    className={`mt-1 flex items-center gap-1 text-[10px] ${
                      mine ? "justify-end text-white/70" : "text-foreground/40"
                    }`}
                  >
                    {bookmarks.has(m.id) && <span>🔖</span>}
                    {mine && m.read_at && <span>읽음</span>}
                    {new Date(m.created_at).toLocaleString("ko-KR")}
                  </p>
                </div>
              </div>
              {hasReactions && (
                <p className="mt-0.5 flex gap-1 px-1 text-xs">
                  {REACTIONS.filter((r) => (counts[r.key] ?? 0) > 0).map((r) => (
                    <span
                      key={r.key}
                      className={`rounded-full border px-1.5 py-0.5 ${
                        myReaction === r.key
                          ? "border-brand bg-brand-tint text-brand-dark"
                          : "border-black/10 text-foreground/60 dark:border-white/10"
                      }`}
                    >
                      {r.emoji} {counts[r.key]}
                    </span>
                  ))}
                </p>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {replyingTo && (
        <p className="mt-2 flex items-center gap-2 rounded-lg bg-black/5 px-3 py-2 text-xs text-foreground/60 dark:bg-white/10">
          <span className="min-w-0 flex-1 truncate">
            ↩️ {replyingTo.body || (replyingTo.attachment_name ? `📎 ${replyingTo.attachment_name}` : "")}
          </span>
          <button
            type="button"
            onClick={() => setReplyingTo(null)}
            className="shrink-0 text-foreground/40 hover:text-red-600"
          >
            ✕
          </button>
        </p>
      )}

      {file && (
        <p className="mt-2 flex items-center gap-2 text-xs text-foreground/60">
          📎 {file.name}
          <button
            type="button"
            onClick={() => setFile(null)}
            className="text-foreground/40 hover:text-red-600"
          >
            ✕
          </button>
        </p>
      )}

      <form onSubmit={handleSend} className="mt-2 flex items-center gap-2">
        <label
          aria-label="사진/동영상 첨부"
          title="사진/동영상 첨부"
          className="flex shrink-0 cursor-pointer items-center justify-center rounded-full border border-black/10 p-2 text-foreground/60 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
        >
          🖼️
          <input
            type="file"
            accept="image/*,video/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
        <label
          aria-label="파일 첨부"
          title="파일 첨부"
          className="flex shrink-0 cursor-pointer items-center justify-center rounded-full border border-black/10 p-2 text-foreground/60 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
        >
          📎
          <input type="file" onChange={handleFileChange} className="hidden" />
        </label>
        <input
          type="text"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="메시지를 입력하세요"
          className="flex-1 rounded-full border border-black/10 px-4 py-2 text-sm dark:border-white/10 dark:bg-white/5"
        />
        <button
          type="submit"
          disabled={sending}
          className="shrink-0 rounded-full bg-brand px-4 py-2 text-sm text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
        >
          보내기
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <AvatarLightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />

      {activeMessage && (
        <MessageActionSheet
          hasBody={!!activeMessage.body}
          myReaction={reactions[activeMessage.id]?.myReaction}
          reactionCounts={reactions[activeMessage.id]?.counts}
          isGroup={false}
          isBookmarked={bookmarks.has(activeMessage.id)}
          onReact={handleReact}
          onCopy={handleCopy}
          onReply={handleReply}
          onForward={handleForward}
          onToggleBookmark={handleToggleBookmark}
          onClose={() => setActiveMessage(null)}
        />
      )}

      {forwardContent && (
        <ForwardPicker userId={user.id} forwardContent={forwardContent} onClose={() => setForwardContent(null)} />
      )}
    </main>
  );
}
