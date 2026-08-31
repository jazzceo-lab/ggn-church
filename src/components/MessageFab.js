"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function MessageFab() {
  const { user, loading, unreadCount } = useAuth();
  const pathname = usePathname();

  if (loading || !user || pathname === "/messages") return null;

  return (
    <Link
      href="/messages"
      aria-label="쪽지함"
      className={`fixed right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full border text-xl shadow-lg shadow-black/15 transition-colors dark:shadow-black/40 ${
        unreadCount > 0
          ? "border-brand bg-brand text-white"
          : "border-brand-dark/30 bg-brand-tint text-brand-dark hover:bg-brand/20 dark:border-brand/30 dark:bg-brand-dark/25 dark:text-brand"
      }`}
      style={{ bottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
    >
      ✉️
      {unreadCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-dark px-1 text-[11px] font-semibold text-white ring-2 ring-background">
          {unreadCount}
        </span>
      )}
    </Link>
  );
}
