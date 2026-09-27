import { createClient } from "@supabase/supabase-js";
import { MIN_PASSWORD_LENGTH } from "@/lib/passwordPolicy";

// 이메일 없이 휴대폰 번호로 가입한 회원은 비밀번호 찾기 메일을 받을 수 없어서,
// 관리자가 임시 비밀번호로 초기화해준다.
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

  const { targetUserId, newPassword } = await request.json();
  if (!targetUserId || typeof newPassword !== "string" || newPassword.length < MIN_PASSWORD_LENGTH) {
    return Response.json(
      { error: `새 비밀번호는 ${MIN_PASSWORD_LENGTH}자 이상이어야 해요.` },
      { status: 400 }
    );
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const { data: callerData, error: callerError } = await adminClient.auth.getUser(accessToken);
  if (callerError || !callerData?.user) {
    return Response.json({ error: "인증에 실패했어요." }, { status: 401 });
  }

  const { data: callerProfile } = await adminClient
    .from("profiles")
    .select("is_admin")
    .eq("id", callerData.user.id)
    .single();

  if (!callerProfile?.is_admin) {
    return Response.json({ error: "관리자만 사용할 수 있어요." }, { status: 403 });
  }

  const { error } = await adminClient.auth.admin.updateUserById(targetUserId, { password: newPassword });
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json({ ok: true });
}
