"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { isPushSubscribed, subscribeToPush } from "@/lib/pushSubscribe";

export default function PushSubscribeButton() {
  const { user } = useAuth();
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      // Capacitor 네이티브 앱의 웹뷰엔 웹 표준 Push API(PushManager)가 없어서,
      // 그 조건만 보면 FCM으로 알림을 받을 수 있는 네이티브 앱에서도 버튼이
      // 숨겨져버린다. 네이티브 플랫폼이면 별도로 지원함을 표시.
      const { Capacitor } = await import("@capacitor/core");
      if (Capacitor.isNativePlatform()) {
        setSupported(true);
        return;
      }
      setSupported(typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window);
    })();
  }, []);

  useEffect(() => {
    if (!supported || !user) return;
    isPushSubscribed(user).then(setSubscribed);
  }, [supported, user]);

  async function handleEnable() {
    if (!user) return;
    setLoading(true);
    const { error } = await subscribeToPush(user);
    setLoading(false);
    if (error) {
      window.alert(error);
      return;
    }
    setSubscribed(true);
  }

  async function handleDisable() {
    setLoading(true);
    try {
      const { Capacitor } = await import("@capacitor/core");
      if (Capacitor.isNativePlatform()) {
        await supabase.from("fcm_tokens").delete().eq("user_id", user.id);
        setSubscribed(false);
        setLoading(false);
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const { error: deleteError } = await supabase
          .from("push_subscriptions")
          .delete()
          .eq("user_id", user.id)
          .eq("endpoint", sub.endpoint);
        if (deleteError) {
          console.error("푸시 구독 삭제 실패:", deleteError.message);
        }
        // 브라우저 푸시 구독은 기기(엔드포인트) 단위라 계정별로 따로 없다.
        // 같은 기기에서 다른 계정도 이 엔드포인트로 구독 중이면 여기서
        // unsubscribe()해버리는 순간 그 계정의 알림까지 같이 끊긴다
        // (한 폰에서 관리자 계정을 번갈아 로그인하는 경우가 실제로 있었음).
        // 이 엔드포인트를 쓰는 다른 계정이 없을 때만 브라우저 구독도 정리한다.
        const { count } = await supabase
          .from("push_subscriptions")
          .select("id", { count: "exact", head: true })
          .eq("endpoint", sub.endpoint);
        if (!count) {
          await sub.unsubscribe();
        }
      }
      setSubscribed(false);
    } catch (e) {
      window.alert("알림 끄기에 실패했어요: " + e.message);
    }
    setLoading(false);
  }

  if (!supported || !user) return null;

  return (
    <button
      onClick={subscribed ? handleDisable : handleEnable}
      disabled={loading}
      aria-label={subscribed ? "채팅 알림 끄기" : "채팅 알림 켜기"}
      title={subscribed ? "채팅 알림 끄기" : "채팅 알림 켜기"}
      className={`flex items-center justify-center rounded-full border p-2 text-sm transition-colors disabled:opacity-50 ${
        subscribed
          ? "border-brand bg-brand-tint text-brand-dark"
          : "border-black/10 text-foreground/70 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
      }`}
    >
      {subscribed ? "🔔" : "🔕"}
    </button>
  );
}
