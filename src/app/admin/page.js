"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

export default function AdminDashboard() {
  const { user, loading: authLoading, isAdmin } = useAuth();

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

  const menuItems = [
    {
      icon: "🏘️",
      title: "교회 기본정보",
      description: "로고, 사진, 주소, 전화번호 관리",
      href: "#",
      badge: "준비중",
    },
    {
      icon: "👥",
      title: "회원 관리",
      description: "교회 회원 정보 및 제직 관리",
      href: "/admin/members",
    },
    {
      icon: "💬",
      title: "게시판 관리",
      description: "게시판 카테고리 추가/삭제/활성화",
      href: "#",
      badge: "준비중",
    },
    {
      icon: "⚙️",
      title: "앱 설정",
      description: "예배시간표, 부서명 등 설정",
      href: "#",
      badge: "준비중",
    },
    {
      icon: "📰",
      title: "콘텐츠 관리",
      description: "주보, 말씀, 교독문 등록",
      href: "/admin/content",
    },
    {
      icon: "📊",
      title: "방문 통계",
      description: "페이지 방문 현황 확인",
      href: "/admin/stats",
    },
    {
      icon: "📝",
      title: "공지사항",
      description: "앱 공지사항 관리",
      href: "/admin/notices",
    },
    {
      icon: "🎯",
      title: "헌금목표 관리",
      description: "헌금목표 설정 및 현황",
      href: "/admin/donation-goals",
    },
    {
      icon: "📋",
      title: "기부금 영수증",
      description: "기부금 영수증 신청 현황",
      href: "/admin/receipts",
    },
  ];

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 pt-3 pb-12">
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-bold text-foreground">관리자 대시보드</h1>
        <p className="mt-2 text-sm text-foreground/50">교회 운영에 필요한 모든 관리 기능을 한곳에서 관리하세요.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`group rounded-xl border border-black/10 bg-white/60 p-5 transition-all dark:border-white/10 dark:bg-white/5 ${
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
        ))}
      </div>
    </main>
  );
}
