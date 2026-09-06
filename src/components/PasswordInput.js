"use client";

import { useState } from "react";

function EyeIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19.5c-7 0-10.5-7-10.5-7a19.4 19.4 0 0 1 4.22-5.53M9.9 5.08A10.9 10.9 0 0 1 12 4.5c7 0 10.5 7 10.5 7a19.5 19.5 0 0 1-2.16 3.19" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <path d="M2 2l20 20" />
    </svg>
  );
}

// 비밀번호를 잘못 입력한 채로 제출하는 실수를 줄이기 위한 눈모양 버튼.
// 다른 곳의 <input type="password">를 그대로 대체해서 쓸 수 있게 나머지 props는 전달만 한다.
export default function PasswordInput({ className, ...props }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        {...props}
        type={visible ? "text" : "password"}
        className={`${className ?? ""} pr-10`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "비밀번호 숨기기" : "비밀번호 표시"}
        title={visible ? "비밀번호 숨기기" : "비밀번호 표시"}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-foreground/40 hover:text-foreground/70"
      >
        {visible ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
      </button>
    </div>
  );
}
