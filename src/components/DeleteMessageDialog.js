"use client";

import { useState } from "react";

export default function DeleteMessageDialog({ canDeleteForEveryone, onConfirm, onClose }) {
  const [scope, setScope] = useState(canDeleteForEveryone ? "all" : "me");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-xs rounded-2xl bg-background p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-serif text-lg font-bold text-foreground">메시지 삭제</h2>

        <div className="mt-4 flex flex-col gap-3 text-sm text-foreground/80">
          {canDeleteForEveryone && (
            <label className="flex items-center justify-between gap-2">
              모두에게서 삭제
              <input
                type="radio"
                name="delete-scope"
                checked={scope === "all"}
                onChange={() => setScope("all")}
              />
            </label>
          )}
          <label className="flex items-center justify-between gap-2">
            나에게서만 삭제
            <input
              type="radio"
              name="delete-scope"
              checked={scope === "me"}
              onChange={() => setScope("me")}
            />
          </label>
        </div>

        {!canDeleteForEveryone && (
          <p className="mt-3 text-xs text-foreground/40">상대가 이미 읽어서 나에게서만 삭제할 수 있어요.</p>
        )}

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full border border-black/10 py-2 text-sm text-foreground/70 dark:border-white/10"
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => onConfirm(scope)}
            className="flex-1 rounded-full bg-brand py-2 text-sm text-white transition-colors hover:bg-brand-dark"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
