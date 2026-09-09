"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabaseClient";

const DEFAULT_MENU_ITEMS = [
  {
    id: "church-info",
    icon: "🏘️",
    title: "교회 기본정보",
    description: "로고, 사진, 주소, 전화번호 관리",
    href: "/admin/church-info",
  },
  {
    id: "members",
    icon: "👥",
    title: "회원 관리",
    description: "교회 회원 정보 및 제직 관리",
    href: "/admin/members",
  },
  {
    id: "boards",
    icon: "💬",
    title: "게시판 관리",
    description: "게시판 카테고리 추가/삭제/활성화",
    href: "/admin/boards",
  },
  {
    id: "settings",
    icon: "⚙️",
    title: "앱 설정",
    description: "예배시간표, 부서명 등 설정",
    href: "/admin/settings",
  },
  {
    id: "content",
    icon: "📰",
    title: "콘텐츠 관리",
    description: "주보, 말씀, 교독문 등록",
    href: "/admin/content",
  },
  {
    id: "stats",
    icon: "📊",
    title: "방문 통계",
    description: "페이지 방문 현황 확인",
    href: "/admin/stats",
  },
  {
    id: "notices",
    icon: "📝",
    title: "공지사항",
    description: "앱 공지사항 관리",
    href: "/admin/notices",
  },
  {
    id: "donation-goals",
    icon: "🎯",
    title: "헌금목표 관리",
    description: "헌금목표 설정 및 현황",
    href: "/admin/donation-goals",
  },
  {
    id: "receipts",
    icon: "📋",
    title: "기부금 영수증",
    description: "기부금 영수증 신청 현황",
    href: "/admin/receipts",
  },
  {
    id: "trash",
    icon: "🗑️",
    title: "휴지통",
    description: "삭제된 게시물 복구 또는 영구 삭제",
    href: "/admin/trash",
  },
];

export default function AdminDashboard() {
  const { user, loading: authLoading, isAdmin, churchId } = useAuth();
  const [menuItems, setMenuItems] = useState(DEFAULT_MENU_ITEMS);
  const [draggingId, setDraggingId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadMenuOrder();
  }, []);

  async function loadMenuOrder() {
    try {
      const { data, error } = await supabase
        .from("admin_menu_order")
        .select("menu_order")
        .eq("id", 1)
        .maybeSingle();

      if (error) {
        console.error("메뉴 순서 로드 실패:", error);
        return;
      }

      if (data?.menu_order) {
        const ordered = data.menu_order
          .map((id) => DEFAULT_MENU_ITEMS.find((item) => item.id === id))
          .filter(Boolean);
        setMenuItems(ordered);
      }
    } catch (err) {
      console.error("메뉴 순서 로드 중 오류:", err);
    }
  }

  async function saveMenuOrder(newOrder) {
    setSaving(true);
    const orderIds = newOrder.map((item) => item.id);
    const { error } = await supabase.from("admin_menu_order").update({
      menu_order: orderIds,
      updated_at: new Date().toISOString(),
    }).eq("id", 1);
    setSaving(false);
    if (error) {
      window.alert("저장에 실패했어요: " + error.message);
    }
  }

  function handleDragStart(e, item) {
    setDraggingId(item.id);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleDrop(e, targetItem) {
    e.preventDefault();
    if (draggingId === targetItem.id) {
      setDraggingId(null);
      return;
    }

    const fromIndex = menuItems.findIndex((item) => item.id === draggingId);
    const toIndex = menuItems.findIndex((item) => item.id === targetItem.id);

    if (fromIndex === -1 || toIndex === -1) return;

    const newOrder = [...menuItems];
    const [removed] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, removed);

    setMenuItems(newOrder);
    setDraggingId(null);
    saveMenuOrder(newOrder);
  }

  if (!authLoading && !isAdmin) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 text-center">
        <h1 className="font-serif text-2xl font-bold text-foreground">관리자 대시보드</h1>
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
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 pt-3 pb-12">
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-bold text-foreground">관리자 대시보드</h1>
        <p className="mt-2 text-sm text-foreground/50">
          교회 운영에 필요한 모든 관리 기능을 한곳에서 관리하세요.
          <br />
          <span className="text-xs text-foreground/40">💡 메뉴를 드래그해서 순서를 변경할 수 있어요.</span>
        </p>
        {saving && <p className="mt-2 text-xs text-brand">저장 중...</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {menuItems.map((item) => (
          <div
            key={item.id}
            draggable
            onDragStart={(e) => handleDragStart(e, item)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, item)}
            className={`cursor-move select-none transition-all ${
              draggingId === item.id ? "opacity-50" : "opacity-100"
            }`}
          >
            <Link
              href={item.href}
              className={`group block rounded-xl border border-black/10 bg-white/60 p-5 transition-all dark:border-white/10 dark:bg-white/5 ${
                item.badge
                  ? "cursor-not-allowed opacity-50"
                  : "hover:border-brand hover:bg-brand-tint dark:hover:bg-brand/10"
              }`}
              onClick={(e) => {
                if (item.badge) e.preventDefault();
              }}
            >
              <div className="flex items-start justify-between">
                <span className="text-3xl">{item.icon}</span>
                {item.badge && (
                  <span className="rounded-full bg-black/10 px-2 py-0.5 text-xs font-medium text-foreground/50 dark:bg-white/10">
                    {item.badge}
                  </span>
                )}
              </div>
              <h3 className="mt-3 font-semibold text-foreground group-hover:text-brand-dark">
                {item.title}
              </h3>
              <p className="mt-1 text-sm text-foreground/60">{item.description}</p>
            </Link>
          </div>
        ))}
      </div>
    </main>
  );
}
