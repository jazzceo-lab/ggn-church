"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import MemberPicker from "@/components/MemberPicker";

export default function ForwardPicker({ userId, forwardContent, onClose }) {
  const [members, setMembers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: dir } = await supabase
        .from("member_directory")
        .select("id, display_name, district, title, avatar_path")
        .neq("id", userId);
      setMembers(dir ?? []);

      const { data: myParticipant } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", userId);
      const conversationIds = (myParticipant ?? []).map((p) => p.conversation_id);

      if (conversationIds.length) {
        const [{ data: convRows }, { data: allParticipants }] = await Promise.all([
          supabase.from("conversations").select("id, name").in("id", conversationIds),
          supabase
            .from("conversation_participants")
            .select("conversation_id, user_id")
            .in("conversation_id", conversationIds),
        ]);
        const nameOf = (id) => dir?.find((m) => m.id === id)?.display_name ?? "알 수 없음";
        const list = (convRows ?? []).map((c) => {
          const otherIds = (allParticipants ?? [])
            .filter((p) => p.conversation_id === c.id && p.user_id !== userId)
            .map((p) => p.user_id);
          return { id: c.id, title: c.name || otherIds.map(nameOf).join(", ") || "그룹 채팅" };
        });
        setGroups(list);
      }
      setLoading(false);
    }
    load();
  }, [userId]);

  function toggleMember(id) {
    setSelectedMemberIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function toggleGroup(id) {
    setSelectedGroupIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleSend() {
    if (selectedMemberIds.length === 0 && selectedGroupIds.length === 0) return;
    setSending(true);
    setError("");

    if (selectedMemberIds.length > 0) {
      const rows = selectedMemberIds.map((recipientId) => ({
        sender_id: userId,
        recipient_id: recipientId,
        body: forwardContent.body,
        attachment_url: forwardContent.attachment_url,
        attachment_name: forwardContent.attachment_name,
      }));
      const { error: dmError } = await supabase.from("messages").insert(rows);
      if (dmError) {
        setSending(false);
        setError("전달에 실패했어요: " + dmError.message);
        return;
      }
    }

    if (selectedGroupIds.length > 0) {
      const rows = selectedGroupIds.map((conversationId) => ({
        conversation_id: conversationId,
        sender_id: userId,
        body: forwardContent.body,
        attachment_url: forwardContent.attachment_url,
        attachment_name: forwardContent.attachment_name,
      }));
      const { error: groupError } = await supabase.from("conversation_messages").insert(rows);
      if (groupError) {
        setSending(false);
        setError("전달에 실패했어요: " + groupError.message);
        return;
      }
    }

    setSending(false);
    setDone(true);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div
        className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-background p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-serif text-lg font-bold text-foreground">다른 대화방으로 전달</h2>

        {done ? (
          <>
            <p className="mt-4 text-sm text-foreground/70">전달했어요.</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 w-full rounded-full bg-brand px-4 py-2 text-sm text-white transition-colors hover:bg-brand-dark"
            >
              닫기
            </button>
          </>
        ) : loading ? (
          <p className="mt-4 text-sm text-foreground/50">불러오는 중...</p>
        ) : (
          <>
            {groups.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-semibold text-brand-dark">참여 중인 그룹</p>
                <ul className="mt-1 flex flex-wrap gap-2">
                  {groups.map((g) => {
                    const checked = selectedGroupIds.includes(g.id);
                    return (
                      <li key={g.id}>
                        <button
                          type="button"
                          onClick={() => toggleGroup(g.id)}
                          className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                            checked
                              ? "border-brand bg-brand text-white"
                              : "border-black/10 text-foreground/70 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
                          }`}
                        >
                          {checked ? "✓ " : ""}👥 {g.title}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            <p className="mt-4 text-xs font-semibold text-brand-dark">교인에게 전달</p>
            <MemberPicker members={members} selectedIds={selectedMemberIds} onToggle={toggleMember} />

            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-full border border-black/10 py-2 text-sm text-foreground/70 dark:border-white/10"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={sending || (selectedMemberIds.length === 0 && selectedGroupIds.length === 0)}
                className="flex-1 rounded-full bg-brand py-2 text-sm text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
              >
                {sending ? "전달하는 중..." : "전달"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
