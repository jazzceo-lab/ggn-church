"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { isPushSubscribed, subscribeToPush } from "@/lib/pushSubscribe";
import { safeGetItem, safeSetItem } from "@/lib/safeStorage";

const DISMISS_KEY = "notifBannerDismissedAt";
const DISMISS_DAYS = 14;

export default function NotificationPromptBanner() {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setVisible(false);
      return;
    }
    const supported = "serviceWorker" in navigator && "PushManager" in window;
    if (!supported) return;

    const dismissedAt = Number(safeGetItem(DISMISS_KEY) || 0);
    if (Date.now() - dismissedAt < DISMISS_DAYS * 24 * 60 * 60 * 1000) return;

    isPushSubscribed(user).then((subscribed) => {
      if (!subscribed) setVisible(true);
    });
  }, [user]);

  async function handleEnable() {
    setLoading(true);
    const { error } = await subscribeToPush(user);
    setLoading(false);
    if (error) {
      window.alert(error);
      return;
    }
    setVisible(false);
  }

  function handleDismiss() {
    safeSetItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="flex items-center justify-between gap-3 bg-brand-tint px-4 py-2.5 text-sm text-brand-dark">
      <span className="break-keep">
        🔔 새 소식을 놓치지 마세요 — 주보·공지·쪽지 알림을 폰으로 바로 받아보세요.
      </span>
      <div className="flex shrink-0 items-center gap-2">
        <button
          onClick={handleEnable}
          disabled={loading}
          className="rounded-full bg-brand px-3 py-1 font-medium text-white disabled:opacity-50"
        >
          {loading ? "설정 중..." : "알림 켜기"}
        </button>
        <button onClick={handleDismiss} aria-label="닫기" className="px-1 text-brand-dark/70">
          ✕
        </button>
      </div>
    </div>
  );
}
