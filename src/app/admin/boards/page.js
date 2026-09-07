"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabaseClient";

export default function AdminBoardsPage() {
  const { user, loading: authLoading, isAdmin, userChurchId } = useAuth();
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formKey, setFormKey] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  async function loadBoards() {
    if (!userChurchId) return;
    setLoading(true);
    const { data, error: loadError } = await supabase
      .from("boards")
      .select("*")
      .eq("church_id", userChurchId)
      .order("display_order", { ascending: true });

    if (loadError) {
      setError("게시판을 불러오지 못했어요: " + loadError.message);
    } else {
      setBoards(data ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadBoards();
  }, [userChurchId]);

  async function handleAddBoard(e) {
    e.preventDefault();
    if (!formName.trim() || !formKey.trim()) {
      setFormError("게시판 이름과 키를 입력해주세요.");
      return;
    }

    setSubmitting(true);
    setFormError("");

    const maxOrder = boards.length > 0 ? Math.max(...boards.map((b) => b.display_order)) : 0;

    const { error: insertError } = await supabase.from("boards").insert({
      church_id: userChurchId,
      board_name: formName.trim(),
      board_key: formKey.trim().toLowerCase(),
      display_order: maxOrder + 1,
    });

    setSubmitting(false);
    if (insertError) {
      setFormError("추가에 실패했어요: " + insertError.message);
      return;
    }

    setFormName("");
    setFormKey("");
    setShowForm(false);
    loadBoards();
  }

  async function handleToggleActive(id, isActive) {
    const { error: updateError } = await supabase
      .from("boards")
      .update({ is_active: !isActive })
      .eq("id", id);

    if (updateError) {
      window.alert("변경에 실패했어요: " + updateError.message);
      return;
    }
    loadBoards();
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`"${name}" 게시판을 삭제할까요?`)) return;

    const { error: deleteError } = await supabase.from("boards").delete().eq("id", id);

    if (deleteError) {
      window.alert("삭제에 실패했어요: " + deleteError.message);
      return;
    }
    loadBoards();
  }

  async function handleChangeOrder(id, direction) {
    const board = boards.find((b) => b.id === id);
    if (!board) return;

    const targetIndex = direction === "up" ? boards.indexOf(board) - 1 : boards.indexOf(board) + 1;
    if (targetIndex < 0 || targetIndex >= boards.length) return;

    const targetBoard = boards[targetIndex];
    const [thisError, targetError] = await Promise.all([
      supabase.from("boards").update({ display_order: targetBoard.display_order }).eq("id", id),
      supabase.from("boards").update({ display_order: board.display_order }).eq("id", targetBoard.id),
    ]);

    if (thisError || targetError) {
      window.alert("순서 변경에 실패했어요.");
      return;
    }
    loadBoards();
  }

  if (!authLoading && !isAdmin) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 text-center">
        <h1 className="font-serif text-2xl font-bold text-foreground">게시판 관리</h1>
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
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-3 pb-12">
      <h1 className="font-serif text-2xl font-bold text-foreground">게시판 관리</h1>
      <p className="mt-2 text-sm text-foreground/50">앱에 표시될 게시판을 관리합니다.</p>

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="mt-4 rounded-full bg-brand px-4 py-2 text-sm text-white hover:bg-brand-dark"
        >
          + 새 게시판 추가
        </button>
      )}

      {showForm && (
        <form
          onSubmit={handleAddBoard}
          className="mt-4 space-y-3 rounded-xl border border-black/10 bg-white/60 p-5 dark:border-white/10 dark:bg-white/5"
        >
          <p className="font-semibold text-foreground">새 게시판</p>
          <div>
            <label className="block text-xs font-medium text-foreground/60">게시판 이름</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="예: 청년부 소식"
              className="mt-1 w-full rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/10"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground/60">
              게시판 키 (영문, 변경 불가)
            </label>
            <input
              type="text"
              value={formKey}
              onChange={(e) => setFormKey(e.target.value)}
              placeholder="예: youth"
              className="mt-1 w-full rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/10"
            />
            <p className="mt-1 text-xs text-foreground/40">
              영문자, 숫자, 하이픈(_)만 사용 가능합니다.
            </p>
          </div>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-brand px-4 py-2 text-sm text-white hover:bg-brand-dark disabled:opacity-50"
            >
              {submitting ? "추가 중..." : "추가"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-full border border-black/10 px-4 py-2 text-sm text-foreground/70 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
            >
              취소
            </button>
          </div>
        </form>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="mt-6 text-sm text-foreground/50">불러오는 중...</p>
      ) : boards.length === 0 ? (
        <p className="mt-6 text-sm text-foreground/50">등록된 게시판이 없어요.</p>
      ) : (
        <ul className="mt-4 divide-y divide-black/10 rounded-xl border border-black/10 bg-white/60 dark:divide-white/10 dark:border-white/10 dark:bg-white/5">
          {boards.map((board, idx) => (
            <li key={board.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex-1">
                <p className="font-medium text-foreground">{board.board_name}</p>
                <p className="mt-0.5 text-xs text-foreground/50">키: {board.board_key}</p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {!board.is_active && (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/40 dark:text-red-300">
                    비활성
                  </span>
                )}

                <div className="flex gap-1">
                  <button
                    onClick={() => handleChangeOrder(board.id, "up")}
                    disabled={idx === 0}
                    className="rounded-full border border-black/10 px-2 py-1 text-xs text-foreground/60 hover:bg-black/5 disabled:opacity-30 dark:border-white/10 dark:hover:bg-white/10"
                    title="위로"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => handleChangeOrder(board.id, "down")}
                    disabled={idx === boards.length - 1}
                    className="rounded-full border border-black/10 px-2 py-1 text-xs text-foreground/60 hover:bg-black/5 disabled:opacity-30 dark:border-white/10 dark:hover:bg-white/10"
                    title="아래로"
                  >
                    ↓
                  </button>
                </div>

                <button
                  onClick={() => handleToggleActive(board.id, board.is_active)}
                  className={`rounded-full px-2 py-1 text-xs transition-colors ${
                    board.is_active
                      ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/40 dark:text-green-300"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-900/40 dark:text-gray-300"
                  }`}
                >
                  {board.is_active ? "활성" : "비활성"}
                </button>

                <button
                  onClick={() => handleDelete(board.id, board.board_name)}
                  className="rounded-full border border-black/10 px-2 py-1 text-xs text-foreground/40 hover:text-red-600 dark:border-white/10"
                >
                  삭제
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
