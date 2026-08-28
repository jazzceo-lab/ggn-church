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
    setSupported(typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window);
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
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("user_id", user.id)
          .eq("endpoint", sub.endpoint);
        await sub.unsubscribe();
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
      aria-label={subscribed ? "쪽지 알림 끄기" : "쪽지 알림 켜기"}
      title={subscribed ? "쪽지 알림 끄기" : "쪽지 알림 켜기"}
      className={`flex items-center justify-center rounded-full border p-2 text-sm transition-colors disabled:opacity-50 ${
        subscribed
          ? "border-brand bg-brand-tint text-brand-dark"
          : "border-black/10 text-foreground/70 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
      }`}
    >
      {subscribed ? "🔕" : "🔔"}
    </button>
  );
}
