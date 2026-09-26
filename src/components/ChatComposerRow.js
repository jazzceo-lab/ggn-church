"use client";

import { useEffect, useRef, useState } from "react";
import ChatComposerInput from "@/components/ChatComposerInput";
import EmojiPickerButton from "@/components/EmojiPickerButton";
import { insertAtCursor } from "@/lib/insertAtCursor";

// 카톡처럼 "+" 버튼 안에 사진/파일 첨부를 숨겨두고, 이모지는 입력창 오른쪽 끝에
// 겹쳐서 넣고, 보내기는 화살표 아이콘만 남긴 채팅 입력줄. 1:1/그룹 채팅 공용.
export default function ChatComposerRow({
  composerRef,
  value,
  onChange,
  onEnterSend,
  onSubmit,
  onFileChange,
  onSchedule,
  sending,
  placeholder = "메시지를 입력하세요",
}) {
  const [showAttach, setShowAttach] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleValue, setScheduleValue] = useState("");
  const attachPopoverRef = useRef(null);
  const attachButtonRef = useRef(null);
  const schedulePopoverRef = useRef(null);
  const scheduleButtonRef = useRef(null);

  useEffect(() => {
    if (!showAttach) return;
    function handleClickOutside(e) {
      if (attachPopoverRef.current?.contains(e.target) || attachButtonRef.current?.contains(e.target)) return;
      setShowAttach(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAttach]);

  useEffect(() => {
    if (!showSchedule) return;
    function handleClickOutside(e) {
      if (schedulePopoverRef.current?.contains(e.target) || scheduleButtonRef.current?.contains(e.target)) return;
      setShowSchedule(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSchedule]);

  function confirmSchedule() {
    if (!scheduleValue) return;
    const scheduledAt = new Date(scheduleValue);
    if (scheduledAt.getTime() <= Date.now()) return;
    onSchedule(scheduledAt);
    setScheduleValue("");
    setShowSchedule(false);
  }

  return (
    <form onSubmit={onSubmit} className="mt-2 flex items-end gap-2">
      <div className="relative">
        <button
          ref={attachButtonRef}
          type="button"
          aria-label="첨부"
          title="첨부"
          onClick={() => setShowAttach((v) => !v)}
          className="flex shrink-0 items-center justify-center rounded-full border border-black/10 p-2 text-lg text-foreground/60 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
        >
          +
        </button>
        {showAttach && (
          <div
            ref={attachPopoverRef}
            className="absolute bottom-full left-0 z-20 mb-2 w-44 space-y-1 rounded-xl border border-black/10 bg-background p-2 shadow-lg dark:border-white/10"
          >
            <label
              onClick={() => setShowAttach(false)}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm text-foreground/70 hover:bg-black/5 dark:hover:bg-white/10"
            >
              🖼️ 사진/동영상
              <input type="file" accept="image/*,video/*" onChange={onFileChange} className="hidden" />
            </label>
            <label
              onClick={() => setShowAttach(false)}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm text-foreground/70 hover:bg-black/5 dark:hover:bg-white/10"
            >
              📎 파일
              <input type="file" onChange={onFileChange} className="hidden" />
            </label>
          </div>
        )}
      </div>

      <div className="relative flex-1">
        <ChatComposerInput
          ref={composerRef}
          value={value}
          onChange={onChange}
          onEnterSend={onEnterSend}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-black/10 py-2 pl-4 pr-11 text-sm dark:border-white/10 dark:bg-white/5"
        />
        <EmojiPickerButton
          onPick={(emoji) => insertAtCursor(composerRef.current, value, onChange, emoji)}
          className="absolute bottom-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-full text-base text-foreground/50 hover:bg-black/5 dark:hover:bg-white/10"
        />
      </div>

      {onSchedule && (
        <div className="relative">
          <button
            ref={scheduleButtonRef}
            type="button"
            aria-label="예약전송"
            title="예약전송"
            onClick={() => setShowSchedule((v) => !v)}
            className="flex shrink-0 items-center justify-center rounded-full border border-black/10 p-2 text-base text-foreground/60 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
          >
            ⏰
          </button>
          {showSchedule && (
            <div
              ref={schedulePopoverRef}
              className="absolute bottom-full right-0 z-20 mb-2 w-64 space-y-2 rounded-xl border border-black/10 bg-background p-3 shadow-lg dark:border-white/10"
            >
              <p className="text-xs text-foreground/60">예약전송 시각을 선택하세요</p>
              <input
                type="datetime-local"
                value={scheduleValue}
                onChange={(e) => setScheduleValue(e.target.value)}
                min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                className="w-full rounded-md border border-black/10 px-2 py-1.5 text-sm dark:border-white/10 dark:bg-white/10"
              />
              <button
                type="button"
                onClick={confirmSchedule}
                disabled={!scheduleValue || (!value.trim())}
                className="w-full rounded-full bg-brand px-3 py-1.5 text-sm text-white hover:bg-brand-dark disabled:opacity-50"
              >
                예약 등록
              </button>
            </div>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={sending}
        aria-label="보내기"
        className="flex shrink-0 items-center justify-center rounded-full bg-brand p-2.5 text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
          <path d="M3 11.5L21 3l-4 18-6-6-4 3v-5l-4-1.5z" />
        </svg>
      </button>
    </form>
  );
}
