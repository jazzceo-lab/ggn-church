"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { isPushSubscribed, subscribeToPush } from "@/lib/pushSubscribe";
import { safeGetItem, safeSetItem } from "@/lib/safeStorage";

const DISMISS_KEY = "notifBannerDismissedAt";
const DISMISS_DAYS = 14;

export default function NotificationPromptBanner({ onResolved }) {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setVisible(false);
      onResolved?.();
      return;
    }
    const supported = "serviceWorker" in navigator && "PushManager" in window;
    if (!supported) {
      onResolved?.();
      return;
    }

    const dismissedAt = Number(safeGetItem(DISMISS_KEY) || 0);
    if (Date.now() - dismissedAt < DISMISS_DAYS * 24 * 60 * 60 * 1000) {
      onResolved?.();
      return;
    }

    isPushSubscribed(user).then((subscribed) => {
      if (subscribed) {
        onResolved?.();
        return;
      }
      if (Notification.permission === "granted") {
        // 권한은 이미 허용됐는데 구독만 끊어진 경우(브라우저 재설치, 구독 만료 등) —
        // 다시 물어볼 필요 없이 조용히 복구를 시도한다. 단, 복구 자체가 실패하면
        // (예: 구독 생성 실패, DB 저장 실패) 조용히 넘어가지 않고 배너를 띄워서
        // 사용자가 직접 "알림 켜기"를 눌러 재시도하고 실패 사유도 볼 수 있게 한다.
        subscribeToPush(user).then(({ error }) => {
          if (error) {
            console.error("알림 자동 재구독 실패:", error);
            setVisible(true);
          } else {
            onResolved?.();
          }
        });
        return;
      }
      setVisible(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    onResolved?.();
  }

  function handleDismiss() {
    safeSetItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
    onResolved?.();
  }

  if (!visible) return null;

  return (
    <div className="flex items-center justify-between gap-3 bg-brand-tint px-4 py-2.5 text-sm text-brand-dark">
      <span className="break-keep">
        🔔 새 소식을 놓치지 마세요 — 주보·공지·채팅 알림을 폰으로 바로 받아보세요.
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
