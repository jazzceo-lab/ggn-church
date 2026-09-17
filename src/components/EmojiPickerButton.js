"use client";

import { useEffect, useRef, useState } from "react";
import { EMOJI_CATEGORIES, getRecentEmojis, pushRecentEmoji } from "@/lib/emojiList";

// 채팅/게시판 입력창 옆에 붙는 이모지 버튼 + 팝업 그리드.
// onPick(emoji)만 넘겨주면 되고, 실제 텍스트 삽입은 호출부에서 처리한다.
export default function EmojiPickerButton({ onPick, className }) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("recent");
  const [recent, setRecent] = useState([]);
  const popoverRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    if (open) setRecent(getRecentEmojis());
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e) {
      if (popoverRef.current?.contains(e.target) || buttonRef.current?.contains(e.target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function handlePick(emoji) {
    pushRecentEmoji(emoji);
    onPick(emoji);
  }

  const tabs = [{ key: "recent", label: "자주쓰는" }, ...EMOJI_CATEGORIES.map((c) => ({ key: c.key, label: c.label }))];
  const activeEmojis =
    category === "recent" ? recent : EMOJI_CATEGORIES.find((c) => c.key === category)?.emojis ?? [];

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label="이모지 넣기"
        title="이모지 넣기"
        onClick={() => setOpen((v) => !v)}
        className={
          className ??
          "flex shrink-0 items-center justify-center rounded-full border border-black/10 p-2 text-foreground/60 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
        }
      >
        😊
      </button>

      {open && (
        <div
          ref={popoverRef}
          className="absolute bottom-full left-0 z-20 mb-2 w-72 rounded-xl border border-black/10 bg-background p-2 shadow-lg dark:border-white/10"
        >
          <div className="flex gap-1 overflow-x-auto border-b border-black/10 pb-1.5 dark:border-white/10">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setCategory(t.key)}
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs whitespace-nowrap transition-colors ${
                  category === t.key
                    ? "bg-brand text-white"
                    : "text-foreground/60 hover:bg-black/5 dark:hover:bg-white/10"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="mt-1.5 grid max-h-48 grid-cols-8 gap-0.5 overflow-y-auto">
            {activeEmojis.length === 0 ? (
              <p className="col-span-8 py-3 text-center text-xs text-foreground/40">
                아직 사용한 이모지가 없어요.
              </p>
            ) : (
              activeEmojis.map((emoji, i) => (
                <button
                  key={`${emoji}-${i}`}
                  type="button"
                  onClick={() => handlePick(emoji)}
                  className="rounded-md py-1 text-lg hover:bg-black/5 dark:hover:bg-white/10"
                >
                  {emoji}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
