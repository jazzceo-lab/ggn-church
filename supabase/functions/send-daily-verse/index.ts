import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;
const APP_ORIGIN = "https://www.ggnch.shop";

webpush.setVapidDetails("mailto:no-reply@ggnch.shop", vapidPublicKey, vapidPrivateKey);

// pg_cron이 5분마다 이 함수를 깨운다. 매번 실제로 보낼지는 여기서 판단한다
// (cron 스케줄 자체를 관리자 설정 바뀔 때마다 재등록하는 것보다 훨씬 단순함).
function kstParts(date: Date) {
  // Deno 런타임은 UTC라서 +9시간 오프셋을 직접 더해 KST 기준 값을 뽑는다.
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  const hh = String(kst.getUTCHours()).padStart(2, "0");
  const mm = String(kst.getUTCMinutes()).padStart(2, "0");
  const dateStr = kst.toISOString().slice(0, 10); // YYYY-MM-DD (KST 기준)
  const weekday = kst.getUTCDay(); // 0=일 ~ 6=토
  return { hhmm: `${hh}:${mm}`, dateStr, weekday, kst };
}

// src/lib/dailyVerses.js의 pickVerseForDay()와 동일 규칙(1년 중 몇 번째 날 % 개수).
// 단, 여기는 KST 기준 날짜로 계산해서 앱에서 보이는 것과 최대한 맞춘다.
function dayOfYearKst(kst: Date) {
  const start = Date.UTC(kst.getUTCFullYear(), 0, 0);
  const diff = Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate()) - start;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

Deno.serve(async (_req) => {
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { hhmm, dateStr, weekday, kst } = kstParts(new Date());

  const { data: settings } = await supabase
    .from("daily_verse_settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (!settings || settings.enabled === false) {
    return new Response(JSON.stringify({ skipped: "disabled" }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // 5분 간격으로 깨우므로, 설정된 발송시각이 속한 5분 구간에서만 통과시킨다.
  const [sh, sm] = settings.send_time.split(":").map(Number);
  const sendMinutes = sh * 60 + sm;
  const nowMinutes = kst.getUTCHours() * 60 + kst.getUTCMinutes();
  const withinWindow = nowMinutes >= sendMinutes && nowMinutes < sendMinutes + 5;

  if (!withinWindow || settings.last_sent_date === dateStr) {
    return new Response(JSON.stringify({ skipped: "not_due" }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (settings.frequency === "weekly" && settings.weekly_day !== weekday) {
    return new Response(JSON.stringify({ skipped: "not_weekly_day" }), {
      headers: { "Content-Type": "application/json" },
    });
  }
  if (settings.frequency === "once" && settings.once_date !== dateStr) {
    return new Response(JSON.stringify({ skipped: "not_once_date" }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  let ref: string;
  let verseText: string;

  if (settings.override_ref && settings.override_text) {
    ref = settings.override_ref;
    verseText = settings.override_text;
  } else {
    const { data: verseRows } = await supabase
      .from("daily_verses")
      .select("ref, verse_text")
      .order("id", { ascending: true });
    if (!verseRows || verseRows.length === 0) {
      return new Response(JSON.stringify({ skipped: "no_verses" }), {
        headers: { "Content-Type": "application/json" },
      });
    }
    const today = verseRows[dayOfYearKst(kst) % verseRows.length];
    ref = today.ref;
    verseText = today.verse_text;
  }

  const imageUrl = `${APP_ORIGIN}/api/daily-verse-image?ref=${encodeURIComponent(ref)}&text=${encodeURIComponent(verseText)}`;
  const notification = {
    title: `📖 오늘의 성경 · ${ref}`,
    body: verseText,
    url: "/scripture",
    image: imageUrl,
  };

  const { data: allSubs } = await supabase
    .from("push_subscriptions")
    .select("id, user_id, endpoint, p256dh, auth");

  let subs = allSubs ?? [];
  if (subs.length) {
    const userIds = [...new Set(subs.map((s) => s.user_id))];
    const { data: prefs } = await supabase
      .from("profiles")
      .select("id, notify_daily_verse")
      .in("id", userIds);
    const disabledIds = new Set(
      (prefs ?? []).filter((p) => p.notify_daily_verse === false).map((p) => p.id)
    );
    subs = subs.filter((s) => !disabledIds.has(s.user_id));
  }

  const payload = JSON.stringify(notification);
  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      )
    )
  );

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === "rejected" && (result.reason?.statusCode === 404 || result.reason?.statusCode === 410)) {
      await supabase.from("push_subscriptions").delete().eq("id", subs[i].id);
    }
  }

  // 발송 완료 표시. once는 1회성이라 다음 발송이 다시 안 걸리도록 날짜를 비운다.
  await supabase
    .from("daily_verse_settings")
    .update({
      last_sent_date: dateStr,
      ...(settings.override_ref || settings.override_text ? { override_ref: null, override_text: null } : {}),
      ...(settings.frequency === "once" ? { once_date: null } : {}),
    })
    .eq("id", 1);

  return new Response(JSON.stringify({ sent: results.length, ref, imageUrl }), {
    headers: { "Content-Type": "application/json" },
  });
});
