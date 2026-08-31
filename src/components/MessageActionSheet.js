"use client";

import { REACTIONS } from "@/lib/reactions";

export default function MessageActionSheet({
  hasBody,
  myReaction,
  reactionCounts,
  isGroup,
  isPinned,
  isBookmarked,
  onReact,
  onCopy,
  onReply,
  onForward,
  onTogglePin,
  onToggleBookmark,
  onClose,
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-t-2xl bg-background p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-1 overflow-x-auto border-b border-black/10 pb-3 dark:border-white/10">
          {REACTIONS.map((r) => {
            const mine = myReaction === r.key;
            const count = reactionCounts?.[r.key] ?? 0;
            return (
              <button
                key={r.key}
                type="button"
                onClick={() => onReact(r.key)}
                title={r.label}
                className={`flex w-14 shrink-0 flex-col items-center gap-0.5 rounded-lg py-2 text-xl leading-none transition-colors ${
                  mine ? "bg-brand-tint dark:bg-brand-dark/30" : "hover:bg-black/5 dark:hover:bg-white/10"
                }`}
              >
                {r.emoji}
                <span className="text-[10px] text-foreground/50">{count > 0 ? count : ""}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-2 flex flex-col text-sm text-foreground/80">
          {hasBody && (
            <button
              type="button"
              onClick={onCopy}
              className="flex items-center gap-3 rounded-lg px-2 py-3 text-left hover:bg-black/5 dark:hover:bg-white/10"
            >
              📋 복사
            </button>
          )}
          <button
            type="button"
            onClick={onReply}
            className="flex items-center gap-3 rounded-lg px-2 py-3 text-left hover:bg-black/5 dark:hover:bg-white/10"
          >
            ↩️ 답장
          </button>
          <button
            type="button"
            onClick={onForward}
            className="flex items-center gap-3 rounded-lg px-2 py-3 text-left hover:bg-black/5 dark:hover:bg-white/10"
          >
            ➡️ 다른 대화방으로 전달
          </button>
          {isGroup && (
            <button
              type="button"
              onClick={onTogglePin}
              className="flex items-center gap-3 rounded-lg px-2 py-3 text-left hover:bg-black/5 dark:hover:bg-white/10"
            >
              📌 {isPinned ? "공지 해제" : "공지로 고정"}
            </button>
          )}
          <button
            type="button"
            onClick={onToggleBookmark}
            className="flex items-center gap-3 rounded-lg px-2 py-3 text-left hover:bg-black/5 dark:hover:bg-white/10"
          >
            🔖 {isBookmarked ? "책갈피 해제" : "책갈피 추가"}
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-2 w-full rounded-lg bg-black/5 py-2.5 text-sm text-foreground/60 dark:bg-white/10"
        >
          닫기
        </button>
      </div>
    </div>
  );
}
