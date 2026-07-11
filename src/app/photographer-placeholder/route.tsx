import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg,#111827 0%,#0f172a 48%,#1f2937 100%)",
          color: "#f8fafc",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "28px" }}>
          <div
            style={{
              width: "170px",
              height: "130px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "10px solid rgba(248,250,252,.9)",
              borderRadius: "32px",
            }}
          >
            <div
              style={{
                width: "68px",
                height: "68px",
                border: "10px solid #d6b873",
                borderRadius: "999px",
              }}
            />
          </div>
          <div style={{ fontSize: "48px", fontWeight: 800 }}>معرض المصور</div>
          <div style={{ fontSize: "25px", color: "rgba(248,250,252,.66)" }}>
            صور · باقات · خدمات تصوير
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    },
  );
}
