import { supabase } from "@/lib/supabaseClient";

// Capacitor 네이티브 앱(안드로이드)에서만 쓰는 FCM 등록. 브라우저는 여전히
// pushSubscribe.js(웹 Push/VAPID)를 그대로 쓴다 — 서버 쪽 send-push/send-daily-verse가
// 두 테이블(push_subscriptions / fcm_tokens)을 모두 조회해서 병행 발송한다.
// 호출하는 쪽(pushSubscribe.js)에서 이미 네이티브 여부를 확인하고 불러온다.
export async function isNativePushSubscribed(user) {
  const { data } = await supabase.from("fcm_tokens").select("id").eq("user_id", user.id).limit(1).maybeSingle();
  return !!data;
}

export async function subscribeNativePush(user) {
  const { PushNotifications } = await import("@capacitor/push-notifications");

  const perm = await PushNotifications.requestPermissions();
  if (perm.receive !== "granted") {
    return { error: "알림 권한을 허용해주셔야 알림을 받을 수 있어요." };
  }

  // register()가 끝나자마자(때로는 그 안에서 동기적으로) "registration" 이벤트가
  // 발생할 수 있어서, 리스너를 먼저 걸어두지 않으면 토큰을 놓친다.
  return new Promise((resolve) => {
    PushNotifications.addListener("registration", async (token) => {
      await supabase
        .from("fcm_tokens")
        .upsert(
          { user_id: user.id, token: token.value, platform: "android", last_seen_at: new Date().toISOString() },
          { onConflict: "user_id,token" }
        );
      resolve({ error: null });
    });

    PushNotifications.addListener("registrationError", (err) => {
      resolve({ error: err?.error || "FCM 등록에 실패했어요." });
    });

    PushNotifications.register();
  });
}

// 알림 탭 시 해당 경로로 이동. sw.js의 notificationclick과 같은 역할.
export async function listenNativeNotificationTap(router) {
  if (typeof window === "undefined") return;
  const { Capacitor } = await import("@capacitor/core");
  if (!Capacitor.isNativePlatform()) return;

  const { PushNotifications } = await import("@capacitor/push-notifications");
  PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
    const url = action.notification?.data?.url;
    if (url) router.push(url);
  });
}
