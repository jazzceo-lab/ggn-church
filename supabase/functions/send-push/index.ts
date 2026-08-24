import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;

webpush.setVapidDetails("mailto:no-reply@ggnch.shop", vapidPublicKey, vapidPrivateKey);

Deno.serve(async (req) => {
  const payload = await req.json();
  const message = payload.record;

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", message.recipient_id);

  const { data: sender } = await supabase
    .from("profiles")
    .select("display_name, email")
    .eq("id", message.sender_id)
    .single();

  const senderName = sender?.display_name || sender?.email || "누군가";

  const notificationPayload = JSON.stringify({
    title: `${senderName}님의 새 쪽지`,
    body: message.body,
    url: `/messages/${message.sender_id}`,
  });

  const results = await Promise.allSettled(
    (subs ?? []).map((sub) =>
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
      await supabase.from("push_subscriptions").delete().eq("id", subs![i].id);
    }
  }

  return new Response(JSON.stringify({ sent: results.length }), {
    headers: { "Content-Type": "application/json" },
  });
});
