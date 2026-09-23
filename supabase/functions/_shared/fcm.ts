// FCM HTTP v1 발송 헬퍼. send-push/send-daily-verse 양쪽에서 공유.
// 서비스 계정 JSON을 FCM_SERVICE_ACCOUNT_JSON 환경변수(Supabase secret)로 받아
// RS256 JWT를 직접 서명하고(Deno Web Crypto, 외부 라이브러리 없음) OAuth 토큰을
// 교환한 뒤 메시지를 보낸다. 액세스 토큰은 함수 인스턴스 생존 기간 동안 캐싱.

let cachedToken: { value: string; expiresAt: number } | null = null;

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function base64url(input: ArrayBuffer | string): string {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : new Uint8Array(input);
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function getAccessToken(serviceAccount: { client_email: string; private_key: string }) {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };
  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claims))}`;

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(serviceAccount.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  const jwt = `${unsigned}.${base64url(signature)}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const data = await res.json();
  if (!data.access_token) throw new Error("FCM OAuth 토큰 발급 실패: " + JSON.stringify(data));

  cachedToken = { value: data.access_token, expiresAt: now * 1000 + data.expires_in * 1000 };
  return cachedToken.value;
}

export async function sendFcm(
  token: string,
  notification: { title: string; body: string; url: string; image?: string }
): Promise<{ ok: boolean; invalidToken: boolean }> {
  const raw = Deno.env.get("FCM_SERVICE_ACCOUNT_JSON");
  if (!raw) return { ok: false, invalidToken: false };
  const serviceAccount = JSON.parse(raw);
  const accessToken = await getAccessToken(serviceAccount);

  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        message: {
          token,
          notification: { title: notification.title, body: notification.body, image: notification.image },
          data: { url: notification.url },
        },
      }),
    }
  );

  if (res.ok) return { ok: true, invalidToken: false };

  const err = await res.json().catch(() => null);
  const status = err?.error?.status;
  // 앱 삭제/토큰 만료 등으로 더 이상 유효하지 않은 토큰 — 정리 대상.
  const invalidToken = status === "NOT_FOUND" || status === "UNREGISTERED" || status === "INVALID_ARGUMENT";
  return { ok: false, invalidToken };
}
