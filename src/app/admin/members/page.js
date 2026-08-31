"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { SIGNUP_GROUP_OPTIONS, DISTRICT_NAMES } from "@/lib/teamRoster";
import { titleBadgeClass } from "@/lib/memberTitle";

const UNASSIGNED = "미배정";
const NO_TITLE = "없음";
const TITLE_OPTIONS = ["목사", "장로"];

// 게시판의 구역게시판이 다루는 소속 목록과 동일해야 함 (src/app/board/page.js의 BOARD_DISTRICTS).
const BOARD_DISTRICTS = [...DISTRICT_NAMES, "청년부"];

const ROLE_OPTIONS = [
  { key: "pastor_reply", label: "교회건의 답변 권한" },
  { key: "media_manager", label: "찬양팀 영상 관리 권한" },
  { key: "district_leader", label: "구역장 (구역공지 권한)", scoped: true },
];
const ROLE_LABELS = Object.fromEntries(ROLE_OPTIONS.map((r) => [r.key, r.label]));
const SCOPED_ROLE_KEYS = new Set(ROLE_OPTIONS.filter((r) => r.scoped).map((r) => r.key));

export default function AdminMembersPage() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifyingIds, setNotifyingIds] = useState(new Set());
  const [rolesByMember, setRolesByMember] = useState({});
  const [newRoleByMember, setNewRoleByMember] = useState({});
  const [newScopeByMember, setNewScopeByMember] = useState({});

  async function loadMembers() {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, email, display_name, district, title, is_admin, is_board_admin, is_suspended, created_at"
      )
      .order("created_at", { ascending: false });

    if (!error) setMembers(data);

    const { data: subs } = await supabase.from("push_subscriptions").select("user_id");
    setNotifyingIds(new Set((subs ?? []).map((s) => s.user_id)));

    const { data: roleRows } = await supabase
      .from("member_roles")
      .select("user_id, role_key, scope");
    const grouped = {};
    for (const r of roleRows ?? []) {
      (grouped[r.user_id] ??= []).push({ roleKey: r.role_key, scope: r.scope });
    }
    setRolesByMember(grouped);

    setLoading(false);
  }

  async function addRole(memberId) {
    const roleKey = newRoleByMember[memberId];
    if (!roleKey) return;
    const scope = SCOPED_ROLE_KEYS.has(roleKey) ? newScopeByMember[memberId] : "";
    if (SCOPED_ROLE_KEYS.has(roleKey) && !scope) {
      window.alert("구역을 선택해주세요.");
      return;
    }
    const { error } = await supabase
      .from("member_roles")
      .insert({ user_id: memberId, role_key: roleKey, scope: scope ?? "" });
    if (error) {
      window.alert("권한 추가에 실패했어요: " + error.message);
      return;
    }
    setNewRoleByMember((prev) => ({ ...prev, [memberId]: "" }));
    setNewScopeByMember((prev) => ({ ...prev, [memberId]: "" }));
    loadMembers();
  }

  async function removeRole(memberId, roleKey, scope) {
    const { error } = await supabase
      .from("member_roles")
      .delete()
      .eq("user_id", memberId)
      .eq("role_key", roleKey)
      .eq("scope", scope ?? "");
    if (error) {
      window.alert("권한 제거에 실패했어요: " + error.message);
      return;
    }
    loadMembers();
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

  async function updateTitle(member, newTitle) {
    const { error } = await supabase
      .from("profiles")
      .update({ title: newTitle || null })
      .eq("id", member.id);
    if (error) {
      window.alert("직함 변경에 실패했어요: " + error.message);
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
                {m.title && (
                  <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${titleBadgeClass(m.title)}`}>
                    {m.title}
                  </span>
                )}
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
                {notifyingIds.has(m.id) && (
                  <span className="ml-2 rounded-full bg-brand-tint px-2 py-0.5 text-xs font-medium text-brand-dark">
                    🔔 알림 켜짐
                  </span>
                )}
              </p>
              <p className="mt-1 text-xs text-foreground/50">{m.email}</p>
              <p className="mt-0.5 text-xs text-foreground/40">
                가입일 {new Date(m.created_at).toLocaleString("ko-KR")}
              </p>
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
              <label className="mt-2 flex items-center gap-2 text-xs text-foreground/60">
                직함
                <select
                  value={m.title ?? NO_TITLE}
                  onChange={(e) => updateTitle(m, e.target.value === NO_TITLE ? "" : e.target.value)}
                  className="rounded-md border border-black/10 px-2 py-1 text-xs dark:border-white/10 dark:bg-white/10"
                >
                  <option value={NO_TITLE}>없음</option>
                  {TITLE_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                {(rolesByMember[m.id] ?? []).map(({ roleKey, scope }) => (
                  <span
                    key={`${roleKey}:${scope}`}
                    className="flex items-center gap-1 rounded-full bg-brand-tint px-2 py-0.5 text-brand-dark"
                  >
                    {ROLE_LABELS[roleKey] ?? roleKey}
                    {scope ? ` (${scope})` : ""}
                    <button
                      onClick={() => removeRole(m.id, roleKey, scope)}
                      aria-label="권한 제거"
                      className="text-brand-dark/60 hover:text-brand-dark"
                    >
                      ✕
                    </button>
                  </span>
                ))}
                <select
                  value={newRoleByMember[m.id] ?? ""}
                  onChange={(e) =>
                    setNewRoleByMember((prev) => ({ ...prev, [m.id]: e.target.value }))
                  }
                  className="rounded-md border border-black/10 px-2 py-1 text-xs dark:border-white/10 dark:bg-white/10"
                >
                  <option value="">권한 추가...</option>
                  {ROLE_OPTIONS.filter(
                    (r) =>
                      SCOPED_ROLE_KEYS.has(r.key) ||
                      !(rolesByMember[m.id] ?? []).some((x) => x.roleKey === r.key)
                  ).map((r) => (
                    <option key={r.key} value={r.key}>
                      {r.label}
                    </option>
                  ))}
                </select>
                {SCOPED_ROLE_KEYS.has(newRoleByMember[m.id]) && (
                  <select
                    value={newScopeByMember[m.id] ?? ""}
                    onChange={(e) =>
                      setNewScopeByMember((prev) => ({ ...prev, [m.id]: e.target.value }))
                    }
                    className="rounded-md border border-black/10 px-2 py-1 text-xs dark:border-white/10 dark:bg-white/10"
                  >
                    <option value="">구역 선택</option>
                    {BOARD_DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                )}
                <button
                  onClick={() => addRole(m.id)}
                  disabled={!newRoleByMember[m.id]}
                  className="rounded-full border border-black/10 px-2 py-1 text-foreground/70 hover:bg-black/5 disabled:opacity-40 dark:border-white/10 dark:hover:bg-white/10"
                >
                  추가
                </button>
              </div>
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
