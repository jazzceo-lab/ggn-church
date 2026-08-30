import { supabase } from "@/lib/supabaseClient";
import { VAPID_PUBLIC_KEY, urlBase64ToUint8Array } from "@/lib/pushConfig";

export async function isPushSubscribed(user) {
  if (!("serviceWorker" in navigator)) return false;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return false;
  const { data } = await supabase
    .from("push_subscriptions")
    .select("id")
    .eq("user_id", user.id)
    .eq("endpoint", sub.endpoint)
    .maybeSingle();
  return !!data;
}

export async function subscribeToPush(user) {
  try {
    const reg = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return { error: "알림 권한을 허용해주셔야 알림을 받을 수 있어요." };
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
      { onConflict: "user_id,endpoint" }
    );

    if (error) return { error: "알림 등록에 실패했어요: " + error.message };
    return { error: null };
  } catch (e) {
    return { error: "알림 설정에 실패했어요: " + e.message };
  }
}
