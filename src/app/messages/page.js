"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { titleBadgeClass } from "@/lib/memberTitle";
import { avatarUrl } from "@/lib/avatar";
import AvatarLightbox from "@/components/AvatarLightbox";
import MemberPicker from "@/components/MemberPicker";

export default function MessagesPage() {
  const {
    user,
    loading: authLoading,
    isAdmin,
    district,
    refreshUnreadCount,
    refreshGroupUnreadCount,
    refreshGroupConversationIds,
  } = useAuth();
  const canSelectAllMembers = isAdmin || district === "목회자";
  const router = useRouter();
  const [conversations, setConversations] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState(null);

  const [selectedIds, setSelectedIds] = useState([]);
  const [composeBody, setComposeBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");

  const [showNewGroup, setShowNewGroup] = useState(false);
  const [groupSelectedIds, setGroupSelectedIds] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [groupBody, setGroupBody] = useState("");
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [groupError, setGroupError] = useState("");

  async function load() {
    setLoading(true);

    const { data: msgs } = await supabase
      .from("messages")
      .select("sender_id, recipient_id, body, created_at, read_at")
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    const { data: dir } = await supabase
      .from("member_directory")
      .select("id, display_name, district, title, avatar_path")
      .neq("id", user.id);

    const nameOf = (id) => dir?.find((m) => m.id === id)?.display_name ?? "알 수 없음";
    const titleOf = (id) => dir?.find((m) => m.id === id)?.title ?? null;
    const avatarOf = (id) => dir?.find((m) => m.id === id)?.avatar_path ?? null;

    const byPartner = new Map();
    for (const m of msgs ?? []) {
      const partnerId = m.sender_id === user.id ? m.recipient_id : m.sender_id;
      if (!byPartner.has(partnerId)) {
        byPartner.set(partnerId, {
          type: "1:1",
          key: `partner-${partnerId}`,
          href: `/messages/${partnerId}`,
          partnerId,
          name: nameOf(partnerId),
          title: titleOf(partnerId),
          avatarPath: avatarOf(partnerId),
          lastBody: m.body,
          lastAt: m.created_at,
          unread: false,
        });
      }
      if (m.recipient_id === user.id && !m.read_at) {
        byPartner.get(partnerId).unread = true;
      }
    }

    const { data: myParticipant } = await supabase
      .from("conversation_participants")
      .select("conversation_id, last_read_at")
      .eq("user_id", user.id);

    const conversationIds = (myParticipant ?? []).map((p) => p.conversation_id);
    const groupItems = [];

    if (conversationIds.length) {
      const [{ data: convRows }, { data: allParticipants }, { data: groupMsgs }] = await Promise.all([
        supabase.from("conversations").select("id, name").in("id", conversationIds),
        supabase
          .from("conversation_participants")
          .select("conversation_id, user_id")
          .in("conversation_id", conversationIds),
        supabase
          .from("conversation_messages")
          .select("conversation_id, sender_id, body, created_at")
          .in("conversation_id", conversationIds)
          .order("created_at", { ascending: false }),
      ]);

      const latestByConv = new Map();
      for (const m of groupMsgs ?? []) {
        if (!latestByConv.has(m.conversation_id)) latestByConv.set(m.conversation_id, m);
      }

      const participantsByConv = new Map();
      for (const p of allParticipants ?? []) {
        if (!participantsByConv.has(p.conversation_id)) participantsByConv.set(p.conversation_id, []);
        participantsByConv.get(p.conversation_id).push(p.user_id);
      }

      const lastReadByConv = new Map((myParticipant ?? []).map((p) => [p.conversation_id, p.last_read_at]));

      for (const conv of convRows ?? []) {
        const last = latestByConv.get(conv.id);
        if (!last) continue;
        const otherIds = (participantsByConv.get(conv.id) ?? []).filter((id) => id !== user.id);
        const title = conv.name || otherIds.map((id) => nameOf(id)).join(", ") || "그룹 채팅";
        const lastReadAt = lastReadByConv.get(conv.id);
        const unread =
          last.sender_id !== user.id && (!lastReadAt || new Date(last.created_at) > new Date(lastReadAt));

        groupItems.push({
          type: "group",
          key: `group-${conv.id}`,
          href: `/messages/group/${conv.id}`,
          title,
          participantCount: otherIds.length + 1,
          lastBody: last.body,
          lastAt: last.created_at,
          unread,
        });
      }
    }

    const merged = [...Array.from(byPartner.values()), ...groupItems].sort((a, b) => {
      if (a.unread !== b.unread) return a.unread ? -1 : 1;
      return new Date(b.lastAt) - new Date(a.lastAt);
    });

    setConversations(merged);
    setMembers(dir ?? []);
    setLoading(false);
  }

  useEffect(() => {
    if (!user) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  function toggleSelected(id) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function toggleGroupSelected(id) {
    setGroupSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleDeleteConversation(partnerId, partnerName) {
    if (!window.confirm(`${partnerName}님과 나눈 채팅을 모두 삭제할까요?`)) return;
    const { error } = await supabase
      .from("messages")
      .delete()
      .or(
        `and(sender_id.eq.${user.id},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${user.id})`
      );
    if (error) {
      window.alert("삭제에 실패했어요: " + error.message);
      return;
    }
    load();
    refreshUnreadCount();
  }

  async function handleSend(e) {
    e.preventDefault();
    if (selectedIds.length === 0 || !composeBody.trim()) return;
    setSending(true);
    setSendError("");

    const rows = selectedIds.map((recipientId) => ({
      sender_id: user.id,
      recipient_id: recipientId,
      body: composeBody,
    }));

    const { error } = await supabase.from("messages").insert(rows);

    setSending(false);
    if (error) {
      setSendError("전송에 실패했어요: " + error.message);
      return;
    }
    setSelectedIds([]);
    setComposeBody("");
    setShowNew(false);
    load();
  }

  async function handleCreateGroup(e) {
    e.preventDefault();
    if (groupSelectedIds.length === 0 || !groupBody.trim()) return;
    setCreatingGroup(true);
    setGroupError("");

    const { data: conv, error: convError } = await supabase
      .from("conversations")
      .insert({ created_by: user.id, name: groupName.trim() || null })
      .select()
      .single();

    if (convError) {
      setCreatingGroup(false);
      setGroupError("그룹 생성에 실패했어요: " + convError.message);
      return;
    }

    const participantRows = [...new Set([user.id, ...groupSelectedIds])].map((id) => ({
      conversation_id: conv.id,
      user_id: id,
    }));
    const { error: participantsError } = await supabase.from("conversation_participants").insert(participantRows);
    if (participantsError) {
      setCreatingGroup(false);
      setGroupError("참여자 추가에 실패했어요: " + participantsError.message);
      return;
    }

    const { error: msgError } = await supabase.from("conversation_messages").insert({
      conversation_id: conv.id,
      sender_id: user.id,
      body: groupBody,
    });
    if (msgError) {
      setCreatingGroup(false);
      setGroupError("메시지 전송에 실패했어요: " + msgError.message);
      return;
    }

    await refreshGroupConversationIds();
    refreshGroupUnreadCount();
    setCreatingGroup(false);
    router.push(`/messages/group/${conv.id}`);
  }

  if (!authLoading && !user) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 text-center">
        <h1 className="font-serif text-2xl font-bold text-foreground">GGN톡</h1>
        <p className="mt-3 text-sm text-foreground/60">
          채팅은 로그인한 교인만 주고받을 수 있어요.
        </p>
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
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-3 pb-12">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold text-foreground">GGN톡</h1>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setShowNew((v) => !v);
              setShowNewGroup(false);
            }}
            className="rounded-full bg-brand px-4 py-2 text-sm text-white transition-colors hover:bg-brand-dark"
          >
            + 새 채팅
          </button>
          <button
            onClick={() => {
              setShowNewGroup((v) => !v);
              setShowNew(false);
            }}
            className="rounded-full border border-brand px-4 py-2 text-sm text-brand-dark transition-colors hover:bg-brand-tint"
          >
            + 새 그룹
          </button>
        </div>
      </div>

      {showNew && (
        <form
          onSubmit={handleSend}
          className="mt-4 rounded-xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5"
        >
          <p className="text-sm font-medium text-foreground/80">
            받는 사람 선택 (여러 명 가능){" "}
            {selectedIds.length > 0 && (
              <span className="text-brand-dark">· {selectedIds.length}명 선택됨</span>
            )}
          </p>
          <MemberPicker members={members} selectedIds={selectedIds} onToggle={toggleSelected} />

          {selectedIds.length > 0 && (
            <div className="mt-4 space-y-2 border-t border-black/10 pt-4 dark:border-white/10">
              <textarea
                required
                rows={3}
                value={composeBody}
                onChange={(e) => setComposeBody(e.target.value)}
                placeholder="메시지를 입력하세요"
                className="w-full rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/10"
              />
              {sendError && <p className="text-sm text-red-600">{sendError}</p>}
              <button
                type="submit"
                disabled={sending}
                className="rounded-full bg-brand px-4 py-2 text-sm text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
              >
                {sending ? "보내는 중..." : `선택한 ${selectedIds.length}명에게 보내기`}
              </button>
            </div>
          )}
        </form>
      )}

      {showNewGroup && (
        <form
          onSubmit={handleCreateGroup}
          className="mt-4 rounded-xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5"
        >
          <p className="text-xs text-foreground/50">
            선택한 사람들이 모두 한 방에서 서로의 메시지를 보고 답장할 수 있어요.
          </p>
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="그룹 이름 (선택 사항)"
            className="mt-2 w-full rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/10"
          />

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm font-medium text-foreground/80">
              참여할 사람 선택{" "}
              {groupSelectedIds.length > 0 && (
                <span className="text-brand-dark">· {groupSelectedIds.length}명 선택됨</span>
              )}
            </p>
            {canSelectAllMembers && (
              <button
                type="button"
                onClick={() =>
                  setGroupSelectedIds(
                    groupSelectedIds.length === members.length ? [] : members.map((m) => m.id)
                  )
                }
                className="text-xs text-brand-dark underline"
              >
                {groupSelectedIds.length === members.length ? "교인 전체 해제" : "교인 전체 선택"}
              </button>
            )}
          </div>
          <MemberPicker members={members} selectedIds={groupSelectedIds} onToggle={toggleGroupSelected} />

          {groupSelectedIds.length > 0 && (
            <div className="mt-4 space-y-2 border-t border-black/10 pt-4 dark:border-white/10">
              <textarea
                required
                rows={3}
                value={groupBody}
                onChange={(e) => setGroupBody(e.target.value)}
                placeholder="첫 메시지를 입력하세요"
                className="w-full rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/10"
              />
              {groupError && <p className="text-sm text-red-600">{groupError}</p>}
              <button
                type="submit"
                disabled={creatingGroup}
                className="rounded-full bg-brand px-4 py-2 text-sm text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
              >
                {creatingGroup ? "만드는 중..." : `${groupSelectedIds.length + 1}명 그룹 만들기`}
              </button>
            </div>
          )}
        </form>
      )}

      <ul className="mt-6 divide-y divide-black/10 rounded-xl border border-black/10 bg-white/60 dark:divide-white/10 dark:border-white/10 dark:bg-white/5">
        {loading && <li className="p-4 text-sm text-foreground/50">불러오는 중...</li>}
        {!loading && conversations.length === 0 && (
          <li className="p-4 text-sm text-foreground/50">아직 나눈 채팅이 없어요.</li>
        )}
        {conversations.map((c) => (
          <li
            key={c.key}
            className={`flex items-center gap-2 p-4 hover:bg-black/5 dark:hover:bg-white/10 ${
              c.unread ? "bg-[#c6ff00]/20 dark:bg-[#c6ff00]/10" : ""
            }`}
          >
            <Link href={c.href} className="flex min-w-0 flex-1 items-center gap-3">
              {c.type === "group" ? (
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-tint text-lg dark:bg-brand-dark/25">
                  👥
                </span>
              ) : avatarUrl(c.avatarPath) ? (
                <img
                  src={avatarUrl(c.avatarPath)}
                  alt=""
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setLightboxUrl(avatarUrl(c.avatarPath));
                  }}
                  className="h-10 w-10 shrink-0 cursor-pointer rounded-full object-cover"
                />
              ) : (
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black/5 text-lg dark:bg-white/10">
                  🙂
                </span>
              )}
              <span className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 font-medium text-foreground">
                  {c.unread && (
                    <span
                      className="h-3 w-3 shrink-0 rounded-full bg-[#c6ff00] shadow-[0_0_5px_1px_rgba(198,255,0,0.7)]"
                      aria-hidden
                    />
                  )}
                  {c.type === "group" ? c.title : c.name}
                  {c.type === "group" && (
                    <span className="rounded-full bg-black/5 px-1.5 py-0.5 text-[10px] font-medium text-foreground/60 dark:bg-white/10">
                      {c.participantCount}명
                    </span>
                  )}
                  {c.type === "1:1" && c.title && (
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${titleBadgeClass(c.title)}`}>
                      {c.title}
                    </span>
                  )}
                </p>
                <p
                  className={`mt-1 truncate text-sm ${
                    c.unread ? "font-medium text-foreground" : "text-foreground/60"
                  }`}
                >
                  {c.lastBody}
                </p>
                <p className="mt-1 text-xs text-foreground/40">
                  {new Date(c.lastAt).toLocaleString("ko-KR")}
                </p>
              </span>
            </Link>
            {c.type === "1:1" && (
              <button
                onClick={() => handleDeleteConversation(c.partnerId, c.name)}
                className="shrink-0 text-xs text-foreground/40 hover:text-red-600"
              >
                삭제
              </button>
            )}
          </li>
        ))}
      </ul>

      <AvatarLightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
    </main>
  );
}
