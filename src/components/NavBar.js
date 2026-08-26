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
  { href: "/", label: "소개" },
  { href: "/bulletin", label: "주보/공지" },
  { href: "/calendar", label: "교회일정" },
  { href: "/scripture", label: "성경" },
  { href: "/donate", label: "헌금안내" },
];

function PowerIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
      <line x1="12" y1="2" x2="12" y2="12" />
    </svg>
  );
}

const memberLinks = [
  { href: "/teams", label: "제직명단" },
  { href: "/media", label: "설교·찬양" },
  { href: "/hymns", label: "찬송가" },
  { href: "/board", label: "게시판", countKey: "board" },
  { href: "/messages", label: "쪽지함", countKey: "messages" },
];

export default function NavBar() {
  const { user, loading, isAdmin, unreadCount, boardNewCount } = useAuth();
  const counts = { messages: unreadCount, board: boardNewCount };
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

          <div className="flex flex-wrap items-center justify-end gap-2">
            <FontSizeControl />
            <ThemeToggle />

            {!loading && user && (
              <Link
                href="/messages"
                aria-label="쪽지함"
                className={`relative rounded-full border px-2 py-1.5 text-sm transition-colors ${
                  unreadCount > 0
                    ? "border-brand bg-brand-tint text-brand-dark"
                    : "border-black/10 text-foreground/70 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
                }`}
              >
                ✉️
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold text-white">
                    {unreadCount}
                  </span>
                )}
              </Link>
            )}

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
                  aria-label="로그아웃"
                  title="로그아웃"
                  className="flex items-center justify-center rounded-full border border-brand bg-brand p-2 text-white transition-colors hover:bg-brand-dark"
                >
                  <PowerIcon className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                aria-label="로그인"
                title="로그인"
                className="flex items-center justify-center rounded-full border border-black/10 p-2 text-foreground/30 transition-colors hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
              >
                <PowerIcon className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>

        <nav className="mt-2 flex gap-x-3 gap-y-1 overflow-x-auto text-sm tracking-tight whitespace-nowrap text-foreground/70">
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
          <nav className="mt-1 grid grid-cols-3 gap-x-3 gap-y-1 text-sm">
            {memberLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative transition-colors hover:text-brand-dark ${
                  user ? "text-foreground/70" : "text-foreground/40"
                }`}
              >
                {link.label}
                {link.countKey && user && counts[link.countKey] > 0 && (
                  <span className="ml-1 rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {counts[link.countKey]}
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
      </div>
    </header>
  );
}
