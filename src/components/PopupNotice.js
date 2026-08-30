"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { safeGetItem, safeSetItem } from "@/lib/safeStorage";

const DISMISSED_KEY = "church_app_dismissed_notice_id";

export default function PopupNotice() {
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    async function loadActiveNotice() {
      const { data } = await supabase
        .from("popup_notices")
        .select("id, title, image_path")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!data) return;

      const dismissedId = safeGetItem(DISMISSED_KEY);
      if (dismissedId === String(data.id)) return;

      setNotice(data);
    }

    loadActiveNotice();
  }, []);

  function handleClose() {
    if (notice) {
      safeSetItem(DISMISSED_KEY, String(notice.id));
    }
    setNotice(null);
  }

  if (!notice) return null;

  const imageUrl = supabase.storage.from("attachments").getPublicUrl(notice.image_path).data
    .publicUrl;

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-full w-full max-w-sm overflow-auto rounded-2xl bg-background shadow-lg"
      >
        <img src={imageUrl} alt={notice.title ?? "공지"} className="w-full" />
        <div className="p-3 text-center">
          <button
            onClick={handleClose}
            className="rounded-full border border-black/10 px-5 py-2 text-sm text-foreground/70 transition-colors hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
