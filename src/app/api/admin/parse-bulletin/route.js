import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

// 관리자는 매주 주보 사진 2장을 받는다: 표지(호수·날짜만 필요)와 상세 페이지
// (예배순서·교회소식). 표어/기도제목/섬김이는 매주 거의 안 바뀌어서 "최근 주보 복사해서
// 새로 만들기"로 이미 채워지므로, 여기서는 매주 실제로 바뀌는 것만 추출한다.
const BulletinExtractSchema = z.object({
  issue: z.string().nullable().describe("표지에 적힌 주보 호수 (예: '27권 34호'). 안 보이면 null"),
  bulletin_date: z
    .string()
    .nullable()
    .describe("표지에 적힌 예배 날짜, YYYY-MM-DD 형식. 안 보이면 null"),
  order: z
    .array(z.object({ label: z.string(), detail: z.string() }))
    .describe("예배순서. 각 항목은 {label, detail} 쌍"),
  news: z.array(z.string()).describe("교회소식 각 항목의 전체 텍스트(번호 제외)"),
});

const SYSTEM_PROMPT = `너는 한국 교회 주보 사진을 읽어서 구조화된 JSON으로 정리하는 도우미야. 매주 두 장의 사진이 들어온다: 표지(호수·날짜만 있음)와 예배순서·교회소식이 나온 상세 페이지. 아래 규칙을 정확히 지켜.

- issue와 bulletin_date는 표지 사진 상단의 "OO권 OO호  YYYY. M. D." 같은 줄에서만 뽑는다. 표어·기도제목·섬김이 등 다른 내용은 읽지 않는다 (이미 다른 방법으로 채워져 있음).
- 예배순서(order)는 상세 페이지에 보이는 순서 그대로, 각 줄을 {label, detail} 쌍으로 만든다. "인사와 나눔", "묵도", "기원", "헌금기도", "축도"처럼 내용이 없는 항목은 detail을 빈 문자열로 둔다.
- "찬송"의 detail은 "OO장 (가사/절 정보)" 형식으로 통일한다. 예: "14장 (2,3절)".
- "교독문"의 detail은 반드시 "OO번 (설명)" 형식으로 쓴다. 사진에 "#10"처럼 써 있어도 "10번"으로 바꾼다.
- "말씀" 항목 바로 아래 "< 설교 제목 >" 형태로 큰 글씨 제목이 있으면, 그 제목을 "말씀" detail에 "설교자 · 「제목」" 형식으로 합쳐 넣는다 (원래 말씀 detail에 설교자 이름만 있었다면 그 뒤에 이어붙인다).
- "성경봉독"의 detail은 반드시 "성경구절 · 이름" 형식으로 만든다 (가운데 점 · 로 구분). 예: "사무엘기상 16:6~13 · 양혜림 집사".
- "< 설교 제목 >" 다음에 이어지는 기도/찬송/헌금기도/축도 등은 별도 섹션이 아니라 그냥 order 배열에 계속 이어서 추가한다.
- 교회소식(news)은 번호(1. 2. 3. ...)를 떼고, 줄바꿈으로 나뉘어 있어도 한 항목이면 하나의 문자열로 합친다.
- 사진에 없는 내용을 지어내지 않는다. 안 보이면 null 또는 빈 배열로 남긴다.`;

export async function POST(request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

  if (!serviceRoleKey) {
    return Response.json({ error: "서버에 서비스 키가 설정되지 않았어요." }, { status: 500 });
  }
  if (!anthropicApiKey) {
    return Response.json(
      { error: "서버에 ANTHROPIC_API_KEY가 설정되지 않았어요. 관리자에게 문의하세요." },
      { status: 500 }
    );
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

  const { images } = await request.json();
  if (!Array.isArray(images) || images.length === 0) {
    return Response.json({ error: "이미지를 하나 이상 올려주세요." }, { status: 400 });
  }
  if (images.length > 6) {
    return Response.json({ error: "이미지는 한 번에 6장까지만 올릴 수 있어요." }, { status: 400 });
  }

  const client = new Anthropic({ apiKey: anthropicApiKey });

  try {
    const response = await client.messages.parse({
      model: "claude-opus-5",
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            ...images.map((img) => ({
              type: "image",
              source: { type: "base64", media_type: img.mediaType, data: img.data },
            })),
            { type: "text", text: "이 주보 사진(들)을 읽어서 정리해줘." },
          ],
        },
      ],
      output_config: { format: zodOutputFormat(BulletinExtractSchema) },
    });

    if (!response.parsed_output) {
      return Response.json({ error: "AI가 내용을 정리하지 못했어요. 다시 시도해주세요." }, { status: 502 });
    }

    return Response.json({ result: response.parsed_output });
  } catch (err) {
    return Response.json({ error: "AI 처리에 실패했어요: " + err.message }, { status: 502 });
  }
}
