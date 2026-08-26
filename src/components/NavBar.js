"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import FontSizeControl from "@/components/FontSizeControl";
import ThemeToggle from "@/components/ThemeToggle";
import PushSubscribeButton from "@/components/PushSubscribeButton";

const publicLinks = [
  { href: "/", label: "교회소개" },
  { href: "/bulletin", label: "주보/공지" },
  { href: "/calendar", label: "교회일정" },
  { href: "/scripture", label: "성경" },
  { href: "/donate", label: "헌금안내" },
];

const memberLinks = [
  { href: "/teams", label: "제직명단" },
  { href: "/media", label: "설교·찬양" },
  { href: "/board", label: "게시판" },
  { href: "/messages", label: "쪽지함", showUnread: true },
];

export default function NavBar() {
  const { user, loading, isAdmin, unreadCount } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-10 border-b border-black/5 bg-background/80 backdrop-blur-md dark:border-white/10">
      <div className="mx-auto max-w-5xl px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <Image
              src="/images/logo-mark.jpg"
              alt="길가는교회 로고"
              width={32}
              height={32}
              className="rounded-full ring-1 ring-black/5"
            />
            <span className="whitespace-nowrap font-serif text-lg font-bold tracking-tight text-foreground">
              길가는교회
            </span>
          </Link>

          <div className="flex items-center gap-2">
            {!loading && user ? (
              <div className="flex flex-wrap items-center justify-end gap-2 text-sm">
                <span className="hidden text-xs text-foreground/50 sm:inline">{user.email}</span>
                <PushSubscribeButton />
                {isAdmin && (
                  <span className="rounded-full bg-brand-tint px-2 py-0.5 text-xs font-medium text-brand-dark">
                    관리자
                  </span>
                )}
                <button
                  onClick={handleLogout}
                  className="whitespace-nowrap rounded-full border border-black/10 px-3 py-1 text-foreground/80 transition-colors hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="whitespace-nowrap rounded-full bg-brand px-3 py-1 text-sm text-white transition-colors hover:bg-brand-dark"
              >
                로그인
              </Link>
            )}
          </div>
        </div>

        <nav className="mt-2 flex gap-x-5 gap-y-1 overflow-x-auto text-sm whitespace-nowrap text-foreground/70">
          {publicLinks.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-brand-dark">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="mt-3 border-t border-black/5 pt-2 dark:border-white/10">
          <p className="text-xs font-medium text-brand-dark">
            교인전용{!user && " · 로그인 후 이용"}
          </p>
          <nav className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1 text-sm sm:flex sm:flex-wrap sm:gap-x-5">
            {memberLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative transition-colors hover:text-brand-dark ${
                  user ? "text-foreground/70" : "text-foreground/40"
                }`}
              >
                {link.label}
                {link.showUnread && user && unreadCount > 0 && (
                  <span className="ml-1 rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {unreadCount}
                  </span>
                )}
              </Link>
            ))}
            {isAdmin && (
              <Link href="/admin/members" className="text-foreground/70 transition-colors hover:text-brand-dark">
                회원 관리
              </Link>
            )}
          </nav>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <FontSizeControl />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
