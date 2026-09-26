"use client";

import { forwardRef, useEffect, useRef } from "react";

// 채팅 입력칸. 글이 길어지면 화면 높이의 절반까지 박스가 같이 늘어나고(공지처럼 긴 글도
// 위 내용이 보이게), 웹(md 이상)에서는 오른쪽 아래 모서리를 드래그해 더 키울 수도 있다.
// 자동 높이는 min-height로 걸어서 사용자가 드래그로 키운 height를 덮어쓰지 않게 한다.
// onEnterSend를 넘기면 Enter=전송/Shift+Enter=줄바꿈, 안 넘기면 Enter는 그냥 줄바꿈.
// forwardRef: 이모지 버튼이 커서 위치에 삽입하려면 실제 textarea DOM이 필요해서 노출한다.
const ChatComposerInput = forwardRef(function ChatComposerInput(
  { value, onChange, onEnterSend, placeholder, className },
  forwardedRef
) {
  const innerRef = useRef(null);
  const ref = forwardedRef ?? innerRef;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!value) el.style.height = "";
    const userHeight = el.style.height;
    el.style.height = "auto";
    el.style.minHeight = "0";
    const maxHeight = window.innerHeight * 0.5;
    const autoHeight = Math.min(el.scrollHeight, maxHeight);
    el.style.height = userHeight;
    el.style.minHeight = autoHeight + "px";
  }, [value, ref]);

  function handleKeyDown(e) {
    if (onEnterSend && e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onEnterSend();
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
      className={`resize-none overflow-y-auto leading-6 md:max-h-[80vh] md:resize-y ${className ?? ""}`}
    />
  );
});

export default ChatComposerInput;
