import { createClient } from "@supabase/supabase-js";

// 회원가입 화면(로그인 전)에서 같은 이름의 기존 회원이 있는지 확인하는 공개 API.
// profiles는 일반 사용자가 직접 조회할 수 없어서, 서비스 키로 서버에서만 조회하고
// 이메일은 일부만 가려서 최소한으로 내려준다 (동명이인 구분 + 본인 중복가입 인지용).
function maskEmail(email) {
  const [local, domain] = String(email ?? "").split("@");
  if (!domain) return null;
  const visible = local.slice(0, 2);
  return `${visible}${"*".repeat(3)}@${domain}`;
}

export async function POST(request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return Response.json({ matches: [] });
  }

  const { display_name } = await request.json();
  const name = (display_name ?? "").trim();
  if (!name) {
    return Response.json({ matches: [] });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const { data, error } = await adminClient.from("profiles").select("email").eq("display_name", name);

  if (error) {
    return Response.json({ matches: [] });
  }

  const matches = (data ?? []).map((p) => maskEmail(p.email)).filter(Boolean);
  return Response.json({ matches });
}
