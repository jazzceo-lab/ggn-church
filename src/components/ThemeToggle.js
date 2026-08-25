"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "theme";

function systemPrefersDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyTheme(isDark) {
  document.documentElement.classList.toggle("dark", isDark);
}

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const initial = saved ? saved === "dark" : systemPrefersDark();
    setIsDark(initial);
    applyTheme(initial);
  }, []);

  function handleToggle() {
    const next = !isDark;
    setIsDark(next);
    applyTheme(next);
    window.localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
  }

  return (
    <button
      onClick={handleToggle}
      aria-label={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
      className="rounded-full border border-black/10 px-2 py-1.5 text-xs text-foreground/70 transition-colors hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
    >
      {isDark ? "☀️" : "🌙"}
    </button>
  );
}
