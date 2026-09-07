"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabaseClient";

// 이 키를 가진 게시판은 코드 곳곳에 특별한 기능이 연결되어 있어서(구역게시판의 구역
// 선택/회비 계좌, 교회제안의 비공개·목회자 답변 권한 등) 삭제하면 그 기능이 깨진다.
// 이름 표시는 바꿔도 되지만 삭제는 막는다.
const PROTECTED_KEYS = new Set(["district", "suggestion"]);

export default function AdminBoardsPage() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formKey, setFormKey] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [renamingId, setRenamingId] = useState(null);
  const [renameInput, setRenameInput] = useState("");

  async function loadBoards() {
    setLoading(true);
    const { data, error: loadError } = await supabase
      .from("boards")
      .select("*")
      .order("display_order", { ascending: true });

    if (loadError) {
      setError("게시판을 불러오지 못했어요: " + loadError.message);
    } else {
      setError("");
      setBoards(data ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (isAdmin) loadBoards();
  }, [isAdmin]);

  async function handleAddBoard(e) {
    e.preventDefault();
    const key = formKey.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    if (!formName.trim() || !key) {
      setFormError("게시판 이름과 키(영문/숫자)를 입력해주세요.");
      return;
    }

    setSubmitting(true);
    setFormError("");

    const maxOrder = boards.length > 0 ? Math.max(...boards.map((b) => b.display_order)) : 0;

    const { error: insertError } = await supabase.from("boards").insert({
      board_key: key,
      board_name: formName.trim(),
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

  async function handleToggleActive(board) {
    const { error: updateError } = await supabase
      .from("boards")
      .update({ is_active: !board.is_active })
      .eq("id", board.id);

    if (updateError) {
      window.alert("변경에 실패했어요: " + updateError.message);
      return;
    }
    loadBoards();
  }

  async function handleDelete(board) {
    if (PROTECTED_KEYS.has(board.board_key)) {
      window.alert(
        `"${board.board_name}"은(는) 앱의 다른 기능과 연결되어 있어서 삭제할 수 없어요. 대신 비활성화를 사용해주세요.`
      );
      return;
    }
    if (!window.confirm(`"${board.board_name}" 게시판을 삭제할까요? 이 게시판의 기존 글은 그대로 남아있지만 화면에서는 안 보이게 돼요.`))
      return;

    const { error: deleteError } = await supabase.from("boards").delete().eq("id", board.id);

    if (deleteError) {
      window.alert("삭제에 실패했어요: " + deleteError.message);
      return;
    }
    loadBoards();
  }

  function startRename(board) {
    setRenamingId(board.id);
    setRenameInput(board.board_name);
  }

  async function saveRename(id) {
    const name = renameInput.trim();
    if (!name) return;
    const { error: updateError } = await supabase.from("boards").update({ board_name: name }).eq("id", id);
    if (updateError) {
      window.alert("이름 변경에 실패했어요: " + updateError.message);
      return;
    }
    setRenamingId(null);
    loadBoards();
  }

  async function handleChangeOrder(board, direction) {
    const idx = boards.findIndex((b) => b.id === board.id);
    const targetIndex = direction === "up" ? idx - 1 : idx + 1;
    if (targetIndex < 0 || targetIndex >= boards.length) return;

    const targetBoard = boards[targetIndex];
    const [{ error: err1 }, { error: err2 }] = await Promise.all([
      supabase.from("boards").update({ display_order: targetBoard.display_order }).eq("id", board.id),
      supabase.from("boards").update({ display_order: board.display_order }).eq("id", targetBoard.id),
    ]);

    if (err1 || err2) {
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
      <p className="mt-2 text-sm text-foreground/50">
        교인들이 보는 게시판 탭의 이름·순서·표시 여부를 관리해요. "구역게시판"과 "교회제안"은
        다른 기능과 연결되어 있어서 삭제할 수 없고 비활성화만 가능해요.
      </p>

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
              게시판 키 (영문/숫자, 한 번 정하면 변경 불가)
            </label>
            <input
              type="text"
              value={formKey}
              onChange={(e) => setFormKey(e.target.value)}
              placeholder="예: youth"
              className="mt-1 w-full rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/10"
            />
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
              <div className="min-w-0 flex-1">
                {renamingId === board.id ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      autoFocus
                      value={renameInput}
                      onChange={(e) => setRenameInput(e.target.value)}
                      className="rounded-md border border-black/10 px-2 py-1 text-sm dark:border-white/10 dark:bg-white/10"
                    />
                    <button
                      onClick={() => saveRename(board.id)}
                      className="rounded-full bg-brand px-2 py-1 text-xs text-white hover:bg-brand-dark"
                    >
                      저장
                    </button>
                    <button
                      onClick={() => setRenamingId(null)}
                      className="text-xs text-foreground/40 hover:text-red-600"
                    >
                      취소
                    </button>
                  </div>
                ) : (
                  <p className="font-medium text-foreground">
                    {board.board_name}
                    {PROTECTED_KEYS.has(board.board_key) && (
                      <span className="ml-2 rounded-full bg-brand-tint px-2 py-0.5 text-[10px] font-medium text-brand-dark">
                        보호됨
                      </span>
                    )}
                  </p>
                )}
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
                    onClick={() => handleChangeOrder(board, "up")}
                    disabled={idx === 0}
                    className="rounded-full border border-black/10 px-2 py-1 text-xs text-foreground/60 hover:bg-black/5 disabled:opacity-30 dark:border-white/10 dark:hover:bg-white/10"
                    title="위로"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => handleChangeOrder(board, "down")}
                    disabled={idx === boards.length - 1}
                    className="rounded-full border border-black/10 px-2 py-1 text-xs text-foreground/60 hover:bg-black/5 disabled:opacity-30 dark:border-white/10 dark:hover:bg-white/10"
                    title="아래로"
                  >
                    ↓
                  </button>
                </div>

                <button
                  onClick={() => startRename(board)}
                  className="rounded-full border border-black/10 px-2 py-1 text-xs text-foreground/60 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
                >
                  이름수정
                </button>

                <button
                  onClick={() => handleToggleActive(board)}
                  className={`rounded-full px-2 py-1 text-xs transition-colors ${
                    board.is_active
                      ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/40 dark:text-green-300"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-900/40 dark:text-gray-300"
                  }`}
                >
                  {board.is_active ? "활성" : "비활성"}
                </button>

                <button
                  onClick={() => handleDelete(board)}
                  disabled={PROTECTED_KEYS.has(board.board_key)}
                  className="rounded-full border border-black/10 px-2 py-1 text-xs text-foreground/40 hover:text-red-600 disabled:opacity-30 disabled:hover:text-foreground/40 dark:border-white/10"
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
