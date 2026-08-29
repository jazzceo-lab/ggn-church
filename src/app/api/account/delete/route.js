import { createClient } from "@supabase/supabase-js";

export async function POST(request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return Response.json({ error: "서버에 서비스 키가 설정되지 않았어요." }, { status: 500 });
  }

  const accessToken = (request.headers.get("authorization") ?? "").replace("Bearer ", "");
  if (!accessToken) {
    return Response.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const { data: callerData, error: callerError } = await adminClient.auth.getUser(accessToken);
  if (callerError || !callerData?.user) {
    return Response.json({ error: "인증에 실패했어요." }, { status: 401 });
  }

  const userId = callerData.user.id;

  await adminClient.from("profiles").delete().eq("id", userId);
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);

  if (deleteError) {
    return Response.json({ error: deleteError.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}
