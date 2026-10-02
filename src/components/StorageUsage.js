"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

// Supabase 무료 플랜 한도
const STORAGE_LIMIT = 1024 ** 3; // 1GB
const DB_LIMIT = 500 * 1024 ** 2; // 500MB
const LABELS = { hymns: "찬송가 악보", media: "미디어", attachments: "채팅·게시판 첨부" };

const mb = (b) => `${Math.round(b / 1024 ** 2)}MB`;

function Bar({ label, used, limit }) {
  const pct = Math.min(100, Math.round((used / limit) * 100));
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-foreground/60">{mb(used)} / {mb(limit)} ({pct}%)</span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-black/10 dark:bg-white/10">
        <div
          className={`h-2 rounded-full ${pct >= 80 ? "bg-red-500" : pct >= 60 ? "bg-amber-500" : "bg-brand"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function StorageUsage() {
  const [usage, setUsage] = useState(null);

  useEffect(() => {
    supabase.rpc("storage_usage").then(({ data }) => setUsage(data));
  }, []);

  if (!usage) return null;

  return (
    <div className="mb-6 space-y-3 rounded-xl border border-black/10 bg-white/60 p-5 dark:border-white/10 dark:bg-white/5">
      <h2 className="font-semibold">💾 저장 공간</h2>
      <Bar label="파일 저장소" used={usage.storage_bytes} limit={STORAGE_LIMIT} />
      <p className="text-xs text-foreground/50">
        {Object.entries(usage.buckets ?? {})
          .sort((a, b) => b[1] - a[1])
          .map(([k, v]) => `${LABELS[k] ?? k} ${mb(v)}`)
          .join(" · ")}
      </p>
      <Bar label="데이터베이스" used={usage.db_bytes} limit={DB_LIMIT} />
      <p className="text-xs text-foreground/40">채팅 사진·동영상은 90일이 지나면 자동으로 삭제돼요.</p>
    </div>
  );
}
