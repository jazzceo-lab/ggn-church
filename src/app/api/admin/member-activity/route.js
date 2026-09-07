import { createClient } from "@supabase/supabase-js";

// 회원 관리 화면에서 "마지막 로그인" 시각을 보여주기 위한 API.
// auth.users는 일반 클라이언트로 조회할 수 없어서(관리자 전용 정보), 서비스 키로 서버에서만 조회한다.
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
  const { data: callerProfile } = await adminClient
    .from("profiles")
    .select("is_admin")
    .eq("id", callerData.user.id)
    .single();
  if (!callerProfile?.is_admin) {
    return Response.json({ error: "관리자만 사용할 수 있어요." }, { status: 403 });
  }

  const activity = {};
  let page = 1;
  const perPage = 1000;
  while (true) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage });
    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
    for (const u of data.users) {
      activity[u.id] = { lastSignInAt: u.last_sign_in_at, createdAt: u.created_at };
    }
    if (data.users.length < perPage) break;
    page += 1;
  }

  return Response.json({ activity });
}
