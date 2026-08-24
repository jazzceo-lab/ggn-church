"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { DISTRICT_NAMES } from "@/lib/teamRoster";

const UNASSIGNED = "미배정";

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    if (!user) return;

    async function load() {
      setLoading(true);

      const { data: msgs } = await supabase
        .from("messages")
        .select("sender_id, recipient_id, body, created_at")
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      const { data: dir } = await supabase
        .from("member_directory")
        .select("id, display_name, district")
        .neq("id", user.id);

      const nameOf = (id) => dir?.find((m) => m.id === id)?.display_name ?? "알 수 없음";

      const byPartner = new Map();
      for (const m of msgs ?? []) {
        const partnerId = m.sender_id === user.id ? m.recipient_id : m.sender_id;
        if (!byPartner.has(partnerId)) {
          byPartner.set(partnerId, {
            partnerId,
            name: nameOf(partnerId),
            lastBody: m.body,
            lastAt: m.created_at,
          });
        }
      }

      setConversations(Array.from(byPartner.values()));
      setMembers(dir ?? []);
      setLoading(false);
    }

    load();
  }, [user]);

  if (!authLoading && !user) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 text-center">
        <h1 className="font-serif text-2xl font-bold text-foreground">쪽지함</h1>
        <p className="mt-3 text-sm text-foreground/60">
          쪽지는 로그인한 교인만 주고받을 수 있어요.
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
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold text-foreground">쪽지함</h1>
        <button
          onClick={() => setShowNew((v) => !v)}
          className="rounded-full bg-brand px-4 py-2 text-sm text-white transition-colors hover:bg-brand-dark"
        >
          + 새 쪽지
        </button>
      </div>

      {showNew && (
        <div className="mt-4 rounded-xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
          <p className="text-sm font-medium text-foreground/80">누구에게 쪽지를 보낼까요?</p>
          {members.length === 0 && (
            <p className="mt-2 text-sm text-foreground/50">다른 교인이 아직 없어요.</p>
          )}
          {[...DISTRICT_NAMES, UNASSIGNED].map((district) => {
            const group = members.filter((m) => (m.district ?? UNASSIGNED) === district);
            if (group.length === 0) return null;
            return (
              <div key={district} className="mt-3">
                <p className="text-xs font-semibold text-brand-dark">{district}</p>
                <ul className="mt-1 flex flex-wrap gap-2">
                  {group.map((m) => (
                    <li key={m.id}>
                      <Link
                        href={`/messages/${m.id}`}
                        className="rounded-full border border-black/10 px-3 py-1 text-sm text-foreground/70 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
                      >
                        {m.display_name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      <ul className="mt-6 divide-y divide-black/10 rounded-xl border border-black/10 bg-white/60 dark:divide-white/10 dark:border-white/10 dark:bg-white/5">
        {loading && <li className="p-4 text-sm text-foreground/50">불러오는 중...</li>}
        {!loading && conversations.length === 0 && (
          <li className="p-4 text-sm text-foreground/50">아직 나눈 쪽지가 없어요.</li>
        )}
        {conversations.map((c) => (
          <li key={c.partnerId}>
            <Link href={`/messages/${c.partnerId}`} className="block p-4 hover:bg-black/5 dark:hover:bg-white/10">
              <p className="font-medium text-foreground">{c.name}</p>
              <p className="mt-1 truncate text-sm text-foreground/60">{c.lastBody}</p>
              <p className="mt-1 text-xs text-foreground/40">
                {new Date(c.lastAt).toLocaleString("ko-KR")}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
