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

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function GroupConversationPage() {
  const { conversationId } = useParams();
  const { user, loading: authLoading, refreshGroupUnreadCount } = useAuth();
  const [conversationName, setConversationName] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [notFound, setNotFound] = useState(false);
  const [thread, setThread] = useState([]);
  const [body, setBody] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  const memberOf = (id) => participants.find((p) => p.id === id) ?? null;

  async function loadThread() {
    if (!user) return;
    setLoading(true);

    const { data: conv } = await supabase
      .from("conversations")
      .select("id, name")
      .eq("id", conversationId)
      .single();

    if (!conv) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setConversationName(conv.name);

    const { data: participantRows } = await supabase
      .from("conversation_participants")
      .select("user_id")
      .eq("conversation_id", conversationId);

    const memberIds = (participantRows ?? []).map((p) => p.user_id);
    const { data: dir } = await supabase
      .from("member_directory")
      .select("id, display_name, title, avatar_path")
      .in("id", memberIds);
    setParticipants(dir ?? []);

    const { data: msgs } = await supabase
      .from("conversation_messages")
      .select("id, sender_id, body, created_at, attachment_url, attachment_name")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    setThread(msgs ?? []);
    setLoading(false);

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
    });

    setSending(false);
    if (error) {
      setError("전송에 실패했어요: " + error.message);
      return;
    }
    setBody("");
    setFile(null);
    loadThread();
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
          ← 쪽지함으로
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
          ← 쪽지함
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

      <div className="mt-4 flex-1 space-y-3 rounded-xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
        {loading && <p className="text-sm text-foreground/50">불러오는 중...</p>}
        {!loading && thread.length === 0 && (
          <p className="text-sm text-foreground/50">아직 나눈 메시지가 없어요. 먼저 인사해보세요!</p>
        )}
        {thread.map((m) => {
          const mine = m.sender_id === user?.id;
          const sender = memberOf(m.sender_id);
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
                <div
                  className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                    mine ? "bg-brand text-white" : "bg-black/5 text-foreground dark:bg-white/10"
                  }`}
                >
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
                    {new Date(m.created_at).toLocaleString("ko-KR")}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

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
    </main>
  );
}
