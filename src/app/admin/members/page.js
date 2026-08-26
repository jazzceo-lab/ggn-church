"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { SIGNUP_GROUP_OPTIONS } from "@/lib/teamRoster";

const UNASSIGNED = "미배정";

export default function AdminMembersPage() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadMembers() {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, display_name, district, is_admin, is_board_admin, is_suspended, created_at")
      .order("created_at", { ascending: false });

    if (!error) setMembers(data);
    setLoading(false);
  }

  useEffect(() => {
    if (isAdmin) loadMembers();
  }, [isAdmin]);

  async function toggleSuspend(member) {
    const { error } = await supabase
      .from("profiles")
      .update({ is_suspended: !member.is_suspended })
      .eq("id", member.id);
    if (error) {
      window.alert("변경에 실패했어요: " + error.message);
      return;
    }
    loadMembers();
  }

  async function updateDistrict(member, newDistrict) {
    const { error } = await supabase
      .from("profiles")
      .update({ district: newDistrict || null })
      .eq("id", member.id);
    if (error) {
      window.alert("구역 변경에 실패했어요: " + error.message);
      return;
    }
    loadMembers();
  }

  async function toggleAdmin(member) {
    const action = member.is_admin ? "해제" : "지정";
    if (!window.confirm(`${member.display_name ?? member.email} 님의 관리자 권한을 ${action}할까요?`))
      return;
    const { error } = await supabase
      .from("profiles")
      .update({ is_admin: !member.is_admin })
      .eq("id", member.id);
    if (error) {
      window.alert("변경에 실패했어요: " + error.message);
      return;
    }
    window.alert(`${member.display_name ?? member.email} 님의 관리자 권한을 ${action}했어요.`);
    loadMembers();
  }

  async function toggleBoardAdmin(member) {
    const action = member.is_board_admin ? "해제" : "지정";
    if (
      !window.confirm(
        `${member.display_name ?? member.email} 님의 게시판 서브관리자 권한을 ${action}할까요?`
      )
    )
      return;
    const { error } = await supabase
      .from("profiles")
      .update({ is_board_admin: !member.is_board_admin })
      .eq("id", member.id);
    if (error) {
      window.alert("변경에 실패했어요: " + error.message);
      return;
    }
    window.alert(`${member.display_name ?? member.email} 님의 게시판 서브관리자 권한을 ${action}했어요.`);
    loadMembers();
  }

  async function handleDelete(member) {
    if (
      !window.confirm(
        `${member.display_name ?? member.email} 님을 완전히 삭제할까요?\n로그인 계정까지 함께 삭제되어, 같은 이메일로 다시 가입할 수 있게 돼요.`
      )
    )
      return;

    const { data: sessionData } = await supabase.auth.getSession();
    const res = await fetch("/api/admin/delete-member", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionData.session?.access_token}`,
      },
      body: JSON.stringify({ targetUserId: member.id }),
    });
    const data = await res.json();

    if (!res.ok) {
      window.alert("삭제에 실패했어요: " + (data.error ?? "알 수 없는 오류"));
      return;
    }
    loadMembers();
  }

  if (!authLoading && !isAdmin) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 text-center">
        <h1 className="font-serif text-2xl font-bold text-foreground">회원 관리</h1>
        <p className="mt-3 text-sm text-foreground/60">관리자만 볼 수 있는 페이지예요.</p>
        {!user && (
          <Link href="/login" className="mt-6 inline-block text-brand-dark underline">
            로그인하러 가기
          </Link>
        )}
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
      <h1 className="font-serif text-2xl font-bold text-foreground">회원 관리</h1>
      <p className="mt-2 text-sm text-foreground/50">가입한 교인 목록입니다.</p>

      <ul className="mt-6 divide-y divide-black/10 rounded-xl border border-black/10 bg-white/60 dark:divide-white/10 dark:border-white/10 dark:bg-white/5">
        {loading && <li className="p-4 text-sm text-foreground/50">불러오는 중...</li>}
        {!loading && members.length === 0 && (
          <li className="p-4 text-sm text-foreground/50">가입한 교인이 없어요.</li>
        )}
        {members.map((m) => (
          <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="font-medium text-foreground">
                {m.display_name ?? "(이름 없음)"}
                {m.is_admin && (
                  <span className="ml-2 rounded-full bg-brand-tint px-2 py-0.5 text-xs font-medium text-brand-dark">
                    관리자
                  </span>
                )}
                {m.is_board_admin && (
                  <span className="ml-2 rounded-full bg-brand-tint px-2 py-0.5 text-xs font-medium text-brand-dark">
                    게시판 서브관리자
                  </span>
                )}
                {m.is_suspended && (
                  <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/40 dark:text-red-300">
                    정지됨
                  </span>
                )}
              </p>
              <p className="mt-1 text-xs text-foreground/50">{m.email}</p>
              <label className="mt-2 flex items-center gap-2 text-xs text-foreground/60">
                구역
                <select
                  value={m.district ?? UNASSIGNED}
                  onChange={(e) =>
                    updateDistrict(m, e.target.value === UNASSIGNED ? "" : e.target.value)
                  }
                  className="rounded-md border border-black/10 px-2 py-1 text-xs dark:border-white/10 dark:bg-white/10"
                >
                  <option value={UNASSIGNED}>미배정</option>
                  {SIGNUP_GROUP_OPTIONS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                onClick={() => toggleAdmin(m)}
                className="rounded-full border border-black/10 px-3 py-1 text-xs text-foreground/70 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
              >
                {m.is_admin ? "관리자 해제" : "관리자 지정"}
              </button>
              <button
                onClick={() => toggleBoardAdmin(m)}
                className="rounded-full border border-black/10 px-3 py-1 text-xs text-foreground/70 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
              >
                {m.is_board_admin ? "서브관리자 해제" : "서브관리자 지정"}
              </button>
              <button
                onClick={() => toggleSuspend(m)}
                className="rounded-full border border-black/10 px-3 py-1 text-xs text-foreground/70 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
              >
                {m.is_suspended ? "정지 해제" : "정지"}
              </button>
              <button
                onClick={() => handleDelete(m)}
                className="rounded-full border border-black/10 px-3 py-1 text-xs text-foreground/70 hover:bg-red-50 hover:text-red-600 dark:border-white/10 dark:hover:bg-red-900/20"
              >
                삭제
              </button>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
