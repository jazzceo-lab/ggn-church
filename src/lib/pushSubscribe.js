import { supabase } from "@/lib/supabaseClient";
import { VAPID_PUBLIC_KEY, urlBase64ToUint8Array } from "@/lib/pushConfig";
import { subscribeNativePush, isNativePushSubscribed } from "@/lib/pushSubscribeNative";

// Capacitor 앱(안드로이드 WebView)은 웹 표준 Push API를 지원하지 않아서 FCM으로
// 갈라진다. 두 경로 다 이 함수들을 그대로 호출하는 기존 화면(알림 배너, 회원정보
// 버튼)은 변경 없이 재사용 — 여기서 플랫폼만 갈라준다.
async function isNative() {
  if (typeof window === "undefined") return false;
  const { Capacitor } = await import("@capacitor/core");
  return Capacitor.isNativePlatform();
}

export async function isPushSubscribed(user) {
  if (await isNative()) return isNativePushSubscribed(user);
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
  if (data) {
    // 앱을 켤 때마다(정상 구독 확인될 때) "아직 쓰는 기기"라는 표시로 갱신 —
    // 90일간 이게 안 찍히면 오래된 구독으로 보고 자동 삭제된다.
    supabase.from("push_subscriptions").update({ last_seen_at: new Date().toISOString() }).eq("id", data.id).then(() => {});
  }
  return !!data;
}

export async function subscribeToPush(user) {
  if (await isNative()) return subscribeNativePush(user);
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
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "user_id,endpoint" }
    );

    if (error) return { error: "알림 등록에 실패했어요: " + error.message };
    return { error: null };
  } catch (e) {
    return { error: "알림 설정에 실패했어요: " + e.message };
  }
}
