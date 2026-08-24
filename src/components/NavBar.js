"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import FontSizeControl from "@/components/FontSizeControl";

const links = [
  { href: "/", label: "교회소개" },
  { href: "/bulletin", label: "주보/공지" },
  { href: "/calendar", label: "교회일정" },
  { href: "/teams", label: "사역팀" },
];

const gridLinks = [
  { href: "/media", label: "설교·찬양" },
  { href: "/scripture", label: "성경·찬송가" },
  { href: "/donate", label: "헌금안내" },
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
        <div className="flex items-center justify-between gap-3">
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

          <div className="flex shrink-0 items-center gap-2">
            <FontSizeControl />
            {!loading && user ? (
              <div className="flex items-center gap-2 text-sm">
                <span className="hidden text-xs text-foreground/50 sm:inline">{user.email}</span>
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
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-brand-dark">
              {link.label}
            </Link>
          ))}
        </nav>

        <nav className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-sm text-foreground/70 sm:flex sm:flex-wrap sm:gap-x-5">
          {gridLinks.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-brand-dark">
              {link.label}
            </Link>
          ))}
          <Link href="/messages" className="relative transition-colors hover:text-brand-dark">
            쪽지함
            {user && unreadCount > 0 && (
              <span className="ml-1 rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-semibold text-white">
                {unreadCount}
              </span>
            )}
          </Link>
          <Link href="/board" className="transition-colors hover:text-brand-dark">
            게시판
          </Link>
        </nav>
      </div>
    </header>
  );
}
