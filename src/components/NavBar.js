"use client";

import { useRef, useState } from "react";
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
  { href: "/bulletin", label: "주보" },
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
  { href: "/board", label: "공지/게시판", countKey: "board" },
  { href: "/messages", label: "쪽지함", countKey: "messages" },
  { href: "/account", label: "회원정보" },
];

// 좁은 간격 때문에 옆 메뉴를 잘못 누르는 경우가 있어서, 누른 순간
// 배경색이 바로 들어와 "지금 이걸 눌렀다"를 시각적으로 확인할 수 있게 한다.
// iOS Safari는 :active 만으로는 탭 시 반응이 잘 안 보여서 터치/마우스
// 이벤트로 직접 눌림 상태를 관리한다.
//
// 빠르게 톡 누르고 떼면(일반적인 탭 동작) 눌림 상태가 너무 짧게 켜졌다
// 꺼져서 눈에 잘 안 띄었다. 최소 노출 시간을 보장하고, 꺼질 때는 서서히
// 사라지게(더 긴 transition) 해서 인지할 시간을 준다.
const MIN_VISIBLE_MS = 220;

// 눌리는 동안 글씨만 살짝(1.05배) 확대해서 하이라이트와 함께 "눌렸다"는
// 느낌을 더 뚜렷하게 준다. 배지(안 읽음 숫자)는 확대 대상에서 제외.
// prefers-reduced-motion에서는 globals.css에서 transform을 무효화한다.
function ScaleLabel({ pressed, children }) {
  return (
    <span
      className={`navlink-scale inline-block origin-left transition-transform duration-300 ${
        pressed ? "scale-105" : "scale-100"
      }`}
    >
      {children}
    </span>
  );
}

function NavLink({ href, className, plain, children }) {
  const [pressed, setPressed] = useState(false);
  const pressStartRef = useRef(0);
  const releaseTimerRef = useRef(null);

  function press() {
    if (releaseTimerRef.current) clearTimeout(releaseTimerRef.current);
    pressStartRef.current = Date.now();
    setPressed(true);
  }

  function release() {
    const elapsed = Date.now() - pressStartRef.current;
    const remaining = MIN_VISIBLE_MS - elapsed;
    if (remaining > 0) {
      releaseTimerRef.current = setTimeout(() => setPressed(false), remaining);
    } else {
      setPressed(false);
    }
  }

  return (
    <Link
      href={href}
      onTouchStart={press}
      onTouchEnd={release}
      onTouchCancel={release}
      onMouseDown={press}
      onMouseUp={release}
      onMouseLeave={release}
      className={
        plain
          ? `block rounded-full px-1 py-1 transition-colors duration-300 ${
              pressed
                ? "bg-brand-tint dark:bg-brand-dark/40"
                : "bg-transparent"
            } ${className}`
          : `-mx-2 -my-1 rounded-full border px-2 py-1 transition-colors duration-300 ${
              pressed
                ? "border-brand-dark bg-brand-tint dark:border-brand dark:bg-brand-dark/40"
                : "border-brand-dark/20 bg-brand/10 dark:border-brand/20 dark:bg-brand-dark/15"
            } ${className}`
      }
    >
      {typeof children === "function" ? children(pressed) : children}
    </Link>
  );
}

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
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  aria-label="로그인"
                  title="로그인"
                  className="flex items-center justify-center rounded-full border border-black/10 p-2 text-foreground/60 transition-colors hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
                >
                  <PowerIcon className="h-4 w-4" />
                </Link>
                <Link
                  href="/signup"
                  aria-label="회원가입"
                  title="회원가입"
                  className="flex items-center justify-center whitespace-nowrap rounded-full border border-brand bg-brand px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
                >
                  회원가입
                </Link>
              </div>
            )}
          </div>
        </div>

        <nav className="mt-2 grid grid-cols-5 gap-x-1 gap-y-1 text-sm tracking-tight text-foreground/70">
          {publicLinks.map((link) => (
            <NavLink key={link.href} href={link.href} plain className="text-center hover:text-brand-dark">
              {(pressed) => <ScaleLabel pressed={pressed}>{link.label}</ScaleLabel>}
            </NavLink>
          ))}
        </nav>

        <div className="mt-3 border-t border-black/5 pt-2 dark:border-white/10">
          <p className="text-xs font-medium text-brand-dark">
            교인전용{!user && " · 로그인 후 이용"}
          </p>
          <nav className="mt-1 grid grid-cols-3 gap-x-6 gap-y-2 text-sm">
            {memberLinks.map((link) => (
              <NavLink
                key={link.href}
                href={link.href}
                className={`relative hover:text-brand-dark ${
                  user ? "text-foreground/70" : "text-foreground/40"
                }`}
              >
                {(pressed) => (
                  <>
                    <ScaleLabel pressed={pressed}>{link.label}</ScaleLabel>
                    {link.countKey && user && counts[link.countKey] > 0 && (
                      <span className="ml-1 rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        {counts[link.countKey]}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
            {isAdmin && (
              <NavLink href="/admin/members" className="text-foreground/70 hover:text-brand-dark">
                {(pressed) => <ScaleLabel pressed={pressed}>회원 관리</ScaleLabel>}
              </NavLink>
            )}
            {isAdmin && (
              <NavLink href="/admin/notices" className="text-foreground/70 hover:text-brand-dark">
                {(pressed) => <ScaleLabel pressed={pressed}>공지 관리</ScaleLabel>}
              </NavLink>
            )}
            {isAdmin && (
              <NavLink href="/admin/receipts" className="text-foreground/70 hover:text-brand-dark">
                {(pressed) => <ScaleLabel pressed={pressed}>영수증 관리</ScaleLabel>}
              </NavLink>
            )}
            {isAdmin && (
              <NavLink href="/admin/donation-goals" className="text-foreground/70 hover:text-brand-dark">
                {(pressed) => <ScaleLabel pressed={pressed}>헌금 목표 관리</ScaleLabel>}
              </NavLink>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
