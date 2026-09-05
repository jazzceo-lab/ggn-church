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
import { getClearedAt, clearConversationLocally } from "@/lib/clearedConversations";

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
  const otherMembers = members.filter((m) => m.id !== user?.id);
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
  const [pinnedKeys, setPinnedKeys] = useState(new Set());

  async function load() {
    setLoading(true);

    const { data: pins } = await supabase
      .from("pinned_conversations")
      .select("conversation_type, conversation_key")
      .eq("user_id", user.id);
    const pinnedSet = new Set((pins ?? []).map((p) => `${p.conversation_type}:${p.conversation_key}`));
    setPinnedKeys(pinnedSet);

    const { data: msgs } = await supabase
      .from("messages")
      .select("sender_id, recipient_id, body, created_at, read_at, deleted_at")
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    const { data: dir } = await supabase
      .from("member_directory")
      .select("id, display_name, district, title, avatar_path");

    const nameOf = (id) => dir?.find((m) => m.id === id)?.display_name ?? "알 수 없음";
    const titleOf = (id) => dir?.find((m) => m.id === id)?.title ?? null;
    const avatarOf = (id) => dir?.find((m) => m.id === id)?.avatar_path ?? null;

    const byPartner = new Map();
    for (const m of msgs ?? []) {
      const partnerId = m.sender_id === user.id ? m.recipient_id : m.sender_id;
      const clearedAt = getClearedAt("dm", partnerId);
      if (clearedAt && new Date(m.created_at) <= new Date(clearedAt)) continue;
      const isSelf = partnerId === user.id;
      if (!byPartner.has(partnerId)) {
        byPartner.set(partnerId, {
          type: "1:1",
          key: `partner-${partnerId}`,
          href: `/messages/${partnerId}`,
          partnerId,
          isSelf,
          pinType: "dm",
          pinKey: partnerId,
          name: isSelf ? "나에게 보내기" : nameOf(partnerId),
          title: isSelf ? null : titleOf(partnerId),
          avatarPath: isSelf ? null : avatarOf(partnerId),
          lastBody: m.body,
          lastAt: m.created_at,
          unread: false,
        });
      }
      if (m.recipient_id === user.id && !m.read_at && !m.deleted_at) {
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
          pinType: "group",
          pinKey: conv.id,
          title,
          participantCount: otherIds.length + 1,
          lastBody: last.body,
          lastAt: last.created_at,
          unread,
        });
      }
    }

    // 아직 나에게 보낸 메시지가 없어도 "나에게 보내기"는 항상 목록에서 바로 열 수 있어야 하니
    // 메시지가 없으면 자리만 만들어둔다 (실제 메시지가 있으면 위에서 이미 채워져 있음).
    if (!byPartner.has(user.id)) {
      byPartner.set(user.id, {
        type: "1:1",
        key: `partner-${user.id}`,
        href: `/messages/${user.id}`,
        partnerId: user.id,
        isSelf: true,
        pinType: "dm",
        pinKey: user.id,
        name: "나에게 보내기",
        title: null,
        avatarPath: null,
        lastBody: "나만 볼 수 있는 메모장이에요",
        lastAt: null,
        unread: false,
      });
    }

    const merged = [...Array.from(byPartner.values()), ...groupItems].sort((a, b) => {
      if (!!a.isSelf !== !!b.isSelf) return a.isSelf ? -1 : 1;
      const aPinned = pinnedSet.has(`${a.pinType}:${a.pinKey}`);
      const bPinned = pinnedSet.has(`${b.pinType}:${b.pinKey}`);
      if (aPinned !== bPinned) return aPinned ? -1 : 1;
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

  async function togglePin(pinType, pinKey) {
    const mapKey = `${pinType}:${pinKey}`;
    const isPinned = pinnedKeys.has(mapKey);

    if (isPinned) {
      await supabase
        .from("pinned_conversations")
        .delete()
        .eq("user_id", user.id)
        .eq("conversation_type", pinType)
        .eq("conversation_key", pinKey);
    } else {
      await supabase
        .from("pinned_conversations")
        .upsert(
          { user_id: user.id, conversation_type: pinType, conversation_key: pinKey },
          { onConflict: "user_id,conversation_type,conversation_key" }
        );
    }

    setPinnedKeys((prev) => {
      const next = new Set(prev);
      if (isPinned) next.delete(mapKey);
      else next.add(mapKey);
      return next;
    });
    load();
  }

  async function handleDeleteConversation(partnerId, partnerName, isSelf) {
    const confirmText = isSelf
      ? "나에게 보낸 메시지를 목록에서 지울까요?"
      : `${partnerName}님과 나눈 채팅을 목록에서 지울까요?\n(내 화면에서만 지워지고, 상대방 화면에는 그대로 남아있어요)`;
    if (!window.confirm(confirmText)) return;

    await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("sender_id", partnerId)
      .eq("recipient_id", user.id)
      .is("read_at", null);

    clearConversationLocally("dm", partnerId, new Date().toISOString());
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
          <MemberPicker
            members={otherMembers}
            selectedIds={selectedIds}
            onToggle={toggleSelected}
            viewerDistrict={district}
            canSelectAllDistricts={canSelectAllMembers}
          />

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
                    groupSelectedIds.length === otherMembers.length ? [] : otherMembers.map((m) => m.id)
                  )
                }
                className="text-xs text-brand-dark underline"
              >
                {groupSelectedIds.length === otherMembers.length ? "교인 전체 해제" : "교인 전체 선택"}
              </button>
            )}
          </div>
          <MemberPicker
            members={members}
            selectedIds={groupSelectedIds}
            onToggle={toggleGroupSelected}
            viewerDistrict={district}
            canSelectAllDistricts={canSelectAllMembers}
            selfId={user?.id}
          />

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
              ) : c.isSelf ? (
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-tint text-lg dark:bg-brand-dark/25">
                  📝
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
                  {pinnedKeys.has(`${c.pinType}:${c.pinKey}`) && <span aria-hidden>📌</span>}
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
                {c.lastAt && (
                  <p className="mt-1 text-xs text-foreground/40">
                    {new Date(c.lastAt).toLocaleString("ko-KR")}
                  </p>
                )}
              </span>
            </Link>
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={() => togglePin(c.pinType, c.pinKey)}
                aria-label={pinnedKeys.has(`${c.pinType}:${c.pinKey}`) ? "고정 해제" : "상단 고정"}
                title={pinnedKeys.has(`${c.pinType}:${c.pinKey}`) ? "고정 해제" : "상단 고정"}
                className={`text-sm ${
                  pinnedKeys.has(`${c.pinType}:${c.pinKey}`)
                    ? "text-brand-dark"
                    : "text-foreground/30 hover:text-foreground/60"
                }`}
              >
                📌
              </button>
              {c.type === "1:1" && (
                <button
                  onClick={() => handleDeleteConversation(c.partnerId, c.name, c.isSelf)}
                  className="text-xs text-foreground/40 hover:text-red-600"
                >
                  삭제
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      <AvatarLightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
    </main>
  );
}
