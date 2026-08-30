import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;

webpush.setVapidDetails("mailto:no-reply@ggnch.shop", vapidPublicKey, vapidPrivateKey);

// 이 함수는 Supabase Database Webhook 3개(messages/posts/media_items의 INSERT)에서
// 공통으로 호출됨. payload.table로 어떤 이벤트인지 구분해서 알림 내용과 받을 사람을 정한다.
// 교회일정(calendar_events)은 등록 시점에 자동 발송하면 안 맞는 경우가 많아 일부러 제외함
// (예: 몇 주 뒤 행사를 미리 등록해도 그 순간 알림이 감) - 필요하면 나중에 관리자가
// 선택한 회원에게만 보내는 별도 기능으로 다룰 것.
Deno.serve(async (req) => {
  const payload = await req.json();
  // 기존 notify_new_message() 함수는 table 없이 record만 보내므로 messages로 간주.
  const table = payload.table || "messages";
  const record = payload.record;

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  let notification;
  let recipientIds = null; // null이면 구독한 전체 회원에게 발송
  let excludeUserId = null;
  // 회원이 profiles에서 종류별로 끌 수 있는 알림 설정 컬럼.
  // posts는 서브게시판(카테고리)별로 컬럼이 다르므로 아래 posts 분기에서 따로 정한다.
  let NOTIFY_COLUMN = { messages: "notify_messages", media_items: "notify_bulletin" }[table] ?? null;

  if (table === "messages") {
    const { data: sender } = await supabase
      .from("profiles")
      .select("display_name, email")
      .eq("id", record.sender_id)
      .single();
    const senderName = sender?.display_name || sender?.email || "누군가";

    notification = {
      title: `${senderName}님의 새 쪽지`,
      body: record.body,
      url: `/messages/${record.sender_id}`,
    };
    recipientIds = [record.recipient_id];
  } else if (table === "media_items" && record.media_type === "bulletin") {
    notification = {
      title: "길가는교회",
      body: "📋 이번 주 주보가 올라왔어요",
      url: "/bulletin",
    };
  } else if (table === "posts") {
    // 구역/기도/나눔/건의 게시판만 알림 발송하며, 서브게시판별로 각자 끌 수 있음.
    // 자료실(resources)·앱사용문의(help)는 알림 발송 대상이 아님.
    const POST_CATEGORY_NOTIFY_COLUMN = {
      district: "notify_board_district",
      prayer: "notify_board_prayer",
      share: "notify_board_share",
      suggestion: "notify_board_suggestion",
    };
    NOTIFY_COLUMN = POST_CATEGORY_NOTIFY_COLUMN[record.category];
    if (!NOTIFY_COLUMN) {
      return new Response(JSON.stringify({ skipped: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }
    notification = {
      title: "길가는교회",
      body: `📌 게시판에 새 글이 올라왔어요: ${record.title}`,
      url: "/board",
    };
    excludeUserId = record.user_id;
  } else {
    return new Response(JSON.stringify({ skipped: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  let query = supabase.from("push_subscriptions").select("id, user_id, endpoint, p256dh, auth");
  if (recipientIds) query = query.in("user_id", recipientIds);
  const { data: allSubs } = await query;

  let subs = (allSubs ?? []).filter((s) => s.user_id !== excludeUserId);

  if (NOTIFY_COLUMN && subs.length) {
    const userIds = [...new Set(subs.map((s) => s.user_id))];
    const { data: prefs } = await supabase.from("profiles").select(`id, ${NOTIFY_COLUMN}`).in("id", userIds);
    // 설정 값이 없거나 true인 사람만 발송 대상. false로 꺼둔 사람만 제외.
    const disabledIds = new Set((prefs ?? []).filter((p) => p[NOTIFY_COLUMN] === false).map((p) => p.id));
    subs = subs.filter((s) => !disabledIds.has(s.user_id));
  }
  const notificationPayload = JSON.stringify(notification);

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        notificationPayload
      )
    )
  );

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === "rejected" && (result.reason?.statusCode === 404 || result.reason?.statusCode === 410)) {
      await supabase.from("push_subscriptions").delete().eq("id", subs[i].id);
    }
  }

  return new Response(JSON.stringify({ sent: results.length }), {
    headers: { "Content-Type": "application/json" },
  });
});
