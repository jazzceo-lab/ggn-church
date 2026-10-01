"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { canManageYouth, canViewYouth } from "@/lib/youth";

const MENUS = [
  { href: "/youth/bulletin", icon: "📖", title: "주보", description: "매주 청년부 예배 주보" },
  { href: "/board?youth=1", icon: "💬", title: "게시판", description: "청년부만 보는 게시판" },
  { href: "/youth/calendar", icon: "📅", title: "일정", description: "모임·수련회·묵상 일정" },
  { href: "/youth/forms", icon: "📝", title: "신청·설문", description: "행사 신청과 설문 응답" },
];

const card =
  "rounded-xl border border-black/10 bg-white/60 p-5 text-left transition-colors hover:border-brand hover:bg-brand-tint/40 dark:border-white/10 dark:bg-white/5";

export default function YouthPage() {
  const auth = useAuth();
  const router = useRouter();
  const canManage = canManageYouth(auth);
  const [notices, setNotices] = useState([]);
  const [joining, setJoining] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  async function loadNotices() {
    const { data } = await supabase
      .from("youth_notices")
      .select("id, title, body, created_at")
      .order("created_at", { ascending: false })
      .limit(5);
    setNotices(data ?? []);
  }

  useEffect(() => {
    if (auth.user && canViewYouth(auth)) loadNotices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.user, auth.district, auth.isBoardAdmin, auth.isAdmin]);

  // 청년부 단톡방: 처음 누르는 사람이 방을 만들고, 이후엔 누르는 사람이 자동으로 들어간다.
  async function openChat() {
    setJoining(true);
    const { data, error } = await supabase.rpc("join_youth_chat");
    setJoining(false);
    if (error) return window.alert("단톡방을 열지 못했어요: " + error.message);
    router.push(`/messages/group/${data}`);
  }

  async function sendNotice(e) {
    e.preventDefault();
    if (!title.trim()) return window.alert("제목을 입력해주세요.");
    if (!window.confirm("청년부 회원 모두에게 알림을 보낼까요?")) return;
    setSending(true);
    const { error } = await supabase.from("youth_notices").insert({ title: title.trim(), body: body.trim() || null });
    setSending(false);
    if (error) return window.alert("보내지 못했어요: " + error.message);
    setTitle("");
    setBody("");
    setShowCompose(false);
    loadNotices();
  }

  async function removeNotice(n) {
    if (!window.confirm(`"${n.title}" 공지를 삭제할까요? (이미 간 알림은 취소되지 않아요)`)) return;
    await supabase.from("youth_notices").delete().eq("id", n.id);
    loadNotices();
  }

  if (!auth.loading && (!auth.user || !canViewYouth(auth))) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 text-center">
        <h1 className="font-serif text-2xl font-bold text-foreground">청년부</h1>
        <p className="mt-3 text-sm text-foreground/60">청년부 회원만 볼 수 있는 메뉴예요.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-3 pb-12">
      <h1 className="font-serif text-2xl font-bold text-foreground">청년부</h1>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {MENUS.map((m) => (
          <Link key={m.href} href={m.href} className={card}>
            <p className="text-2xl">{m.icon}</p>
            <p className="mt-2 font-medium text-foreground">{m.title}</p>
            <p className="mt-1 text-xs text-foreground/50">{m.description}</p>
          </Link>
        ))}
        <button type="button" onClick={openChat} disabled={joining} className={`${card} disabled:opacity-50`}>
          <p className="text-2xl">🗨️</p>
          <p className="mt-2 font-medium text-foreground">단톡방</p>
          <p className="mt-1 text-xs text-foreground/50">{joining ? "여는 중..." : "청년부 GGN톡 단체방"}</p>
        </button>
      </div>

      <section className="mt-8">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-serif font-semibold text-foreground">📢 청년부 공지</h2>
          {canManage && !showCompose && (
            <button
              onClick={() => setShowCompose(true)}
              className="rounded-full bg-brand px-3 py-1.5 text-xs text-white hover:bg-brand-dark"
            >
              + 공지 알림 보내기
            </button>
          )}
        </div>

        {showCompose && (
          <form
            onSubmit={sendNotice}
            className="mt-3 space-y-2 rounded-xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5"
          >
            <p className="text-xs text-foreground/50">청년부 회원에게만 푸시 알림이 가요.</p>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목 (알림에 표시돼요)"
              className="w-full rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/10"
            />
            <textarea
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="내용 (선택)"
              className="w-full rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/10"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={sending}
                className="rounded-full bg-brand px-4 py-2 text-sm text-white hover:bg-brand-dark disabled:opacity-50"
              >
                {sending ? "보내는 중..." : "알림 보내기"}
              </button>
              <button
                type="button"
                onClick={() => setShowCompose(false)}
                className="rounded-full border border-black/10 px-4 py-2 text-sm text-foreground/70 dark:border-white/10"
              >
                취소
              </button>
            </div>
          </form>
        )}

        {notices.length === 0 ? (
          <p className="mt-3 text-sm text-foreground/50">아직 공지가 없어요.</p>
        ) : (
          <ul className="mt-3 divide-y divide-black/10 rounded-xl border border-black/10 bg-white/60 dark:divide-white/10 dark:border-white/10 dark:bg-white/5">
            {notices.map((n) => (
              <li key={n.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-foreground">{n.title}</p>
                  <span className="shrink-0 text-xs text-foreground/40">
                    {new Date(n.created_at).toLocaleDateString("ko-KR")}
                  </span>
                </div>
                {n.body && <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/60">{n.body}</p>}
                {canManage && (
                  <button onClick={() => removeNotice(n)} className="mt-1 text-xs text-red-500 underline">
                    삭제
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
