"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { titleBadgeClass } from "@/lib/memberTitle";
import { safeStoragePath } from "@/lib/storagePath";
import { uploadFileWithRetry } from "@/lib/uploadWithRetry";
import { resizeImageFile } from "@/lib/resizeImage";
import { isImageAttachment } from "@/lib/attachment";
import { REACTIONS } from "@/lib/reactions";
import { loadMessageReactions, toggleMessageReaction } from "@/lib/messageReactions";
import { loadMessageBookmarks, toggleMessageBookmark } from "@/lib/messageBookmarks";
import MessageActionSheet from "@/components/MessageActionSheet";
import ForwardPicker from "@/components/ForwardPicker";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function GroupConversationPage() {
  const { conversationId } = useParams();
  const { user, loading: authLoading, refreshGroupUnreadCount } = useAuth();
  const [conversationName, setConversationName] = useState(null);
  const [pinnedMessageId, setPinnedMessageId] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [lastReadMap, setLastReadMap] = useState({});
  const [notFound, setNotFound] = useState(false);
  const [thread, setThread] = useState([]);
  const [body, setBody] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
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

  const memberOf = (id) => participants.find((p) => p.id === id) ?? null;

  function unreadCountFor(m) {
    const others = participants.filter((p) => p.id !== m.sender_id);
    return others.filter((p) => {
      const lastRead = lastReadMap[p.id];
      return !lastRead || new Date(lastRead) < new Date(m.created_at);
    }).length;
  }

  async function loadThread() {
    if (!user) return;
    setLoading(true);

    const { data: conv } = await supabase
      .from("conversations")
      .select("id, name, pinned_message_id")
      .eq("id", conversationId)
      .single();

    if (!conv) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setConversationName(conv.name);
    setPinnedMessageId(conv.pinned_message_id);

    const { data: participantRows } = await supabase
      .from("conversation_participants")
      .select("user_id, last_read_at")
      .eq("conversation_id", conversationId);

    const memberIds = (participantRows ?? []).map((p) => p.user_id);
    const { data: dir } = await supabase
      .from("member_directory")
      .select("id, display_name, title, avatar_path")
      .in("id", memberIds);
    setParticipants(dir ?? []);
    setLastReadMap(Object.fromEntries((participantRows ?? []).map((p) => [p.user_id, p.last_read_at])));

    const { data: msgs } = await supabase
      .from("conversation_messages")
      .select("id, sender_id, body, created_at, attachment_url, attachment_name, reply_to_id")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    setThread(msgs ?? []);
    setLoading(false);

    const ids = (msgs ?? []).map((m) => m.id);
    loadMessageReactions("group", ids, user.id).then(setReactions);
    loadMessageBookmarks("group", ids, user.id).then(setBookmarks);

    await supabase
      .from("conversation_participants")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id);
    refreshGroupUnreadCount();
  }

  useEffect(() => {
    loadThread();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, conversationId]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`group-conversation-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "conversation_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setThread((prev) => (prev.some((m) => m.id === payload.new.id) ? prev : [...prev, payload.new]));
          if (payload.new.sender_id !== user.id) {
            supabase
              .from("conversation_participants")
              .update({ last_read_at: new Date().toISOString() })
              .eq("conversation_id", conversationId)
              .eq("user_id", user.id)
              .then(() => refreshGroupUnreadCount());
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversation_participants",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setLastReadMap((prev) => ({ ...prev, [payload.new.user_id]: payload.new.last_read_at }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, conversationId]);

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

    const { error } = await supabase.from("conversation_messages").insert({
      conversation_id: conversationId,
      sender_id: user.id,
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
    await toggleMessageReaction("group", activeMessage.id, user.id, myReaction, reactionType);
    setActiveMessage(null);
    const ids = thread.map((m) => m.id);
    loadMessageReactions("group", ids, user.id).then(setReactions);
  }

  async function handleToggleBookmark() {
    if (!activeMessage) return;
    const bookmarked = bookmarks.has(activeMessage.id);
    await toggleMessageBookmark("group", activeMessage.id, user.id, bookmarked);
    setActiveMessage(null);
    const ids = thread.map((m) => m.id);
    loadMessageBookmarks("group", ids, user.id).then(setBookmarks);
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

  async function handleTogglePin() {
    if (!activeMessage) return;
    const nextPinnedId = pinnedMessageId === activeMessage.id ? null : activeMessage.id;
    const { error: pinError } = await supabase
      .from("conversations")
      .update({ pinned_message_id: nextPinnedId })
      .eq("id", conversationId);
    if (pinError) {
      window.alert("공지 설정에 실패했어요: " + pinError.message);
      return;
    }
    setPinnedMessageId(nextPinnedId);
    setActiveMessage(null);
  }

  async function handleDeleteMessage(id) {
    if (!window.confirm("이 메시지를 삭제할까요?")) return;
    const { error } = await supabase.from("conversation_messages").delete().eq("id", id);
    if (error) {
      window.alert("삭제에 실패했어요: " + error.message);
      return;
    }
    setThread((prev) => prev.filter((m) => m.id !== id));
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

  if (!loading && notFound) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 text-center">
        <p className="text-sm text-foreground/60">권한이 없거나 존재하지 않는 그룹이에요.</p>
        <Link href="/messages" className="mt-4 inline-block text-brand-dark underline">
          ← GGN톡으로
        </Link>
      </main>
    );
  }

  const otherParticipants = participants.filter((p) => p.id !== user?.id);
  const title = conversationName || otherParticipants.map((p) => p.display_name).join(", ") || "그룹 채팅";

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pt-3 pb-12">
      <div className="flex items-center gap-3">
        <Link href="/messages" className="text-sm text-foreground/50 hover:underline">
          ← GGN톡
        </Link>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-tint text-sm dark:bg-brand-dark/25">
          👥
        </span>
        <h1 className="flex min-w-0 items-center gap-1.5 truncate font-serif text-xl font-bold text-foreground">
          {title}
          {participants.length > 0 && (
            <span className="shrink-0 text-sm font-normal text-foreground/50">({participants.length}명)</span>
          )}
        </h1>
      </div>

      {pinnedMessageId &&
        (() => {
          const pinned = thread.find((t) => t.id === pinnedMessageId);
          if (!pinned) return null;
          return (
            <p className="mt-3 flex items-start gap-2 rounded-lg bg-brand-tint px-3 py-2 text-xs text-brand-dark dark:bg-brand-dark/20">
              <span className="shrink-0">📌 공지</span>
              <span className="min-w-0 flex-1 truncate">
                {pinned.body || (pinned.attachment_name ? `📎 ${pinned.attachment_name}` : "")}
              </span>
            </p>
          );
        })()}

      <div className="mt-4 flex-1 space-y-3 rounded-xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
        {loading && <p className="text-sm text-foreground/50">불러오는 중...</p>}
        {!loading && thread.length === 0 && (
          <p className="text-sm text-foreground/50">아직 나눈 메시지가 없어요. 먼저 인사해보세요!</p>
        )}
        {thread.map((m) => {
          const mine = m.sender_id === user?.id;
          const sender = memberOf(m.sender_id);
          const repliedTo = m.reply_to_id ? thread.find((t) => t.id === m.reply_to_id) : null;
          const myReaction = reactions[m.id]?.myReaction;
          const counts = reactions[m.id]?.counts ?? {};
          const hasReactions = Object.values(counts).some((c) => c > 0);
          return (
            <div key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
              {!mine && (
                <p className="mb-1 flex items-center gap-1.5 px-1 text-xs text-foreground/50">
                  {sender?.display_name ?? "알 수 없음"}
                  {sender?.title && (
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${titleBadgeClass(sender.title)}`}>
                      {sender.title}
                    </span>
                  )}
                </p>
              )}
              <div className={`flex items-end gap-1 ${mine ? "justify-end" : "justify-start"}`}>
                {mine && (
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
                {mine && unreadCountFor(m) > 0 && (
                  <span className="text-[11px] font-medium text-amber-500">{unreadCountFor(m)}</span>
                )}
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
                    {pinnedMessageId === m.id && <span>📌</span>}
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

      {activeMessage && (
        <MessageActionSheet
          hasBody={!!activeMessage.body}
          myReaction={reactions[activeMessage.id]?.myReaction}
          reactionCounts={reactions[activeMessage.id]?.counts}
          isGroup
          isPinned={pinnedMessageId === activeMessage.id}
          isBookmarked={bookmarks.has(activeMessage.id)}
          onReact={handleReact}
          onCopy={handleCopy}
          onReply={handleReply}
          onForward={handleForward}
          onTogglePin={handleTogglePin}
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
