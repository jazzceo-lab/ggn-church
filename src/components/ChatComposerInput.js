"use client";

import { useEffect, useRef } from "react";

const MAX_HEIGHT = 120; // 이 높이를 넘으면 박스 안에서 스크롤

// 채팅 입력칸. 한 줄 넘게 쓰면 위 내용이 안 보이던 문제를 고치기 위해, 글이 길어지면
// 박스가 같이 늘어나는 textarea로 만들었다. Enter는 전송, Shift+Enter는 줄바꿈.
export default function ChatComposerInput({ value, onChange, onEnterSend, placeholder, className }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, MAX_HEIGHT) + "px";
  }, [value]);

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onEnterSend?.();
    }
  }

  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      className={`resize-none overflow-y-auto leading-6 ${className ?? ""}`}
    />
  );
}
