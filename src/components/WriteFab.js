"use client";

import { useAuth } from "@/components/AuthProvider";

// 어느 화면에서나 누르면 게시판으로 이동하면서 글쓰기 창이 바로 열리는 버튼.
// 게시글이 쌓여서 글쓰기 폼이 화면 아래로 밀려 안 보이는 문제를 해결하기 위함.
export default function WriteFab() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <a
      href="/board?compose=1"
      aria-label="새 글 쓰기"
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-3xl leading-none text-white shadow-lg transition-colors hover:bg-brand-dark"
    >
      +
    </a>
  );
}
