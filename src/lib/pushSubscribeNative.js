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

  let perm;
  try {
    perm = await PushNotifications.requestPermissions();
  } catch (e) {
    return { error: "권한 요청 중 오류: " + e.message };
  }
  if (perm.receive !== "granted") {
    return { error: "알림 권한을 허용해주셔야 알림을 받을 수 있어요." };
  }

  // register()가 끝나자마자(때로는 그 안에서 동기적으로) "registration" 이벤트가
  // 발생할 수 있어서, 리스너를 먼저 걸어두지 않으면 토큰을 놓친다.
  // Play Services/FCM 쪽 문제로 두 이벤트 다 안 오는 경우를 대비해 타임아웃도 둔다
  // (안 두면 실패 원인도 못 보고 그냥 무한 대기하게 됨).
  return new Promise((resolve) => {
    let done = false;
    const finish = (result) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve(result);
    };
    const timer = setTimeout(() => finish({ error: "등록 응답 없음(10초 타임아웃) — Play Services/FCM 문제일 수 있음" }), 10000);

    PushNotifications.addListener("registration", async (token) => {
      const { error: upsertError } = await supabase
        .from("fcm_tokens")
        .upsert(
          { user_id: user.id, token: token.value, platform: "android", last_seen_at: new Date().toISOString() },
          { onConflict: "user_id,token" }
        );
      finish({ error: upsertError ? "토큰 저장 실패: " + upsertError.message : null });
    });

    PushNotifications.addListener("registrationError", (err) => {
      finish({ error: err?.error || "FCM 등록에 실패했어요." });
    });

    try {
      PushNotifications.register();
    } catch (e) {
      finish({ error: "register() 호출 중 오류: " + e.message });
    }
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

// 앱을 열 때마다(최초 실행 + 백그라운드에서 복귀할 때) 알림 목록/배지를 비운다.
// 안 지우면 알림을 다 읽어도 홈 화면 아이콘 배지 숫자가 그대로 남아있음.
export async function clearNativeNotificationsOnResume() {
  if (typeof window === "undefined") return;
  const { Capacitor } = await import("@capacitor/core");
  if (!Capacitor.isNativePlatform()) return;

  const { PushNotifications } = await import("@capacitor/push-notifications");
  const { App } = await import("@capacitor/app");

  PushNotifications.removeAllDeliveredNotifications();
  App.addListener("appStateChange", ({ isActive }) => {
    if (isActive) PushNotifications.removeAllDeliveredNotifications();
  });
}
