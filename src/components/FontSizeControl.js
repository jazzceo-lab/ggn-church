"use client";

import { useEffect, useState } from "react";

const LEVELS = [
  { key: "base", label: "가" },
  { key: "lg", label: "가+" },
  { key: "xl", label: "가++" },
];
const STORAGE_KEY = "font-size";

export default function FontSizeControl() {
  const [level, setLevel] = useState("base");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY) || "base";
    setLevel(saved);
    applyLevel(saved);
  }, []);

  function applyLevel(next) {
    if (next === "base") {
      document.documentElement.removeAttribute("data-font-size");
    } else {
      document.documentElement.setAttribute("data-font-size", next);
    }
  }

  function handleSelect(next) {
    setLevel(next);
    applyLevel(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }

  return (
    <div className="flex items-center gap-1 rounded-full border border-black/10 p-0.5 dark:border-white/10">
      {LEVELS.map((l) => (
        <button
          key={l.key}
          onClick={() => handleSelect(l.key)}
          aria-label={`글자 크기 ${l.label}`}
          aria-pressed={level === l.key}
          className={`rounded-full px-2 py-1 text-xs font-medium transition-colors ${
            level === l.key
              ? "bg-brand text-white"
              : "text-foreground/60 hover:bg-black/5 dark:hover:bg-white/10"
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
