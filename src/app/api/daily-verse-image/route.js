import { ImageResponse } from "next/og";

export const runtime = "edge";

// 오늘의 성경 푸시 알림용 이미지. 확정된 "오솔길" 스타일(기도제목 카드와 동일 톤)을
// 그대로 쓰되, 로고는 좌측 상단으로 배치. ref/text는 쿼리스트링으로 받는다 —
// send-daily-verse 엣지함수가 이 URL을 notification.image로 그대로 넘긴다.
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const ref = searchParams.get("ref") || "";
  const text = searchParams.get("text") || "";
  const origin = new URL(req.url).origin;

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          position: "relative",
          background: "#f3e8e1",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -140,
            left: 450,
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "#e3d2c5",
          }}
        />
        {[
          [560, 60, 640, 630],
          [470, 220, 520, 300],
          [680, 220, 730, 300],
          [410, 320, 470, 420],
          [730, 320, 790, 420],
          [330, 430, 410, 560],
          [790, 430, 870, 560],
        ].map(([x1, y1, x2], i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x1,
              top: y1,
              width: x2 - x1,
              height: 630 - y1,
              background: "#c19c89",
              opacity: 0.16,
              clipPath: "polygon(0% 100%, 100% 100%, 50% 0%)",
            }}
          />
        ))}

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
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "0 130px",
          }}
        >
          <div style={{ fontSize: 26, fontWeight: 700, color: "#9e7d6d", marginBottom: 10 }}>
            📖 오늘의 성경
          </div>
          <div style={{ fontSize: 46, fontWeight: 800, color: "#3b2e27", marginBottom: 22 }}>{ref}</div>
          <div style={{ fontSize: 28, lineHeight: 1.5, color: "#5a4a40", maxWidth: 780 }}>{text}</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
