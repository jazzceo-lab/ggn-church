import { ImageResponse } from "next/og";

export const runtime = "edge";

// 오늘의 성경 푸시 알림용 이미지. 확정된 "교독문 심플 십자가" 스타일 —
// 교독문 표지처럼 얇은 선 십자가만 배경에 두고, 로고는 좌측 상단에 배치.
// ref/text는 쿼리스트링으로 받는다 — send-daily-verse 엣지함수가 이 URL을
// notification.image로 그대로 넘긴다.
// portrait=1이면 전체화면 뷰어(daily-verse-card 페이지)용 세로 비율로 렌더링.
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const ref = searchParams.get("ref") || "";
  const text = searchParams.get("text") || "";
  const portrait = searchParams.get("portrait") === "1";
  const origin = new URL(req.url).origin;

  const width = portrait ? 1080 : 1200;
  const height = portrait ? 1920 : 630;

  return new ImageResponse(
    (
      <div
        style={{
          width: `${width}px`,
          height: `${height}px`,
          display: "flex",
          position: "relative",
          background: "linear-gradient(180deg, #f7f4ef 0%, #eee7dc 60%, #ddcdb0 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: height / 2 - height * 0.19,
            left: width / 2 - 6,
            width: 12,
            height: height * 0.38,
            borderRadius: 6,
            background: "#b3a58f",
            opacity: 0.55,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: height / 2 - height * 0.07,
            left: width / 2 - width * 0.09,
            width: width * 0.18,
            height: 12,
            borderRadius: 6,
            background: "#b3a58f",
            opacity: 0.55,
          }}
        />

        <div style={{ position: "absolute", top: 40, left: 56, display: "flex", alignItems: "center", gap: 12 }}>
          <img
            src={`${origin}/images/logo-mark.jpg`}
            width={44}
            height={44}
            style={{ borderRadius: "50%" }}
          />
          <span style={{ fontSize: 22, fontWeight: 700, color: "#3b2e27" }}>길가는교회</span>
        </div>

        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: `0 ${portrait ? 80 : 130}px`,
          }}
        >
          <div style={{ fontSize: 26, fontWeight: 700, color: "#9e7d6d", marginBottom: 10 }}>
            📖 오늘의 성경
          </div>
          <div style={{ fontSize: 46, fontWeight: 800, color: "#3b2e27", marginBottom: 22 }}>{ref}</div>
          <div style={{ fontSize: 28, lineHeight: 1.5, color: "#5a4a40", maxWidth: portrait ? 860 : 780 }}>
            {text}
          </div>
        </div>
      </div>
    ),
    { width, height }
  );
}
