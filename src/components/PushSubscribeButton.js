"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { VAPID_PUBLIC_KEY, urlBase64ToUint8Array } from "@/lib/pushConfig";

export default function PushSubscribeButton() {
  const { user } = useAuth();
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window);
  }, []);

  useEffect(() => {
    if (!supported || !user) return;
    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setSubscribed(!!sub);
    });
  }, [supported, user]);

  async function handleEnable() {
    if (!user) return;
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        window.alert("알림 권한을 허용해주셔야 알림을 받을 수 있어요.");
        setLoading(false);
        return;
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const json = sub.toJSON();
      const { error } = await supabase.from("push_subscriptions").upsert(
        {
          user_id: user.id,
          endpoint: json.endpoint,
          p256dh: json.keys.p256dh,
          auth: json.keys.auth,
        },
        { onConflict: "endpoint" }
      );

      if (error) {
        window.alert("알림 등록에 실패했어요: " + error.message);
      } else {
        setSubscribed(true);
      }
    } catch (e) {
      window.alert("알림 설정에 실패했어요: " + e.message);
    }
    setLoading(false);
  }

  if (!supported || !user || subscribed) return null;

  return (
    <button
      onClick={handleEnable}
      disabled={loading}
      className="rounded-full border border-black/10 px-3 py-1 text-xs text-foreground/70 transition-colors hover:bg-black/5 disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/10"
    >
      🔔 {loading ? "설정 중..." : "쪽지 알림 켜기"}
    </button>
  );
}
