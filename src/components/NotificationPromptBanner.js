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

    isPushSubscribed(user).then((subscribed) => {
      if (subscribed) {
        onResolved?.();
        return;
      }
      if (Notification.permission === "granted") {
        // 권한은 이미 허용됐는데 구독만 끊어진 경우(브라우저 재설치, 구독 만료 등) —
        // 화면에 아무것도 띄우지 않는 조용한 복구라서, "배너 닫기" 쿨다운과 무관하게
        // 항상 시도한다. 복구 자체가 실패하면(구독 생성 실패, DB 저장 실패 등) 그때는
        // 사용자가 직접 볼 수 있게 배너를 띄운다(단, 이때는 닫기 쿨다운을 존중한다).
        subscribeToPush(user).then(({ error }) => {
          if (!error) {
            onResolved?.();
            return;
          }
          console.error("알림 자동 재구독 실패:", error);
          const dismissedAt = Number(safeGetItem(DISMISS_KEY) || 0);
          if (Date.now() - dismissedAt < DISMISS_DAYS * 24 * 60 * 60 * 1000) {
            onResolved?.();
          } else {
            setVisible(true);
          }
        });
        return;
      }
      const dismissedAt = Number(safeGetItem(DISMISS_KEY) || 0);
      if (Date.now() - dismissedAt < DISMISS_DAYS * 24 * 60 * 60 * 1000) {
        onResolved?.();
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
