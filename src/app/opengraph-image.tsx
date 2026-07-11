import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const alt = "FrameID - موقع احترافي للمصورين في رابط واحد";
export const size = {
  width: 1200,
  height: 630
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #070707 0%, #17120b 56%, #d8b46a 160%)",
          color: "#fff",
          padding: "72px",
          direction: "rtl"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 42, fontWeight: 700, letterSpacing: "-0.02em" }}>FrameID</div>
          <div
            style={{
              border: "1px solid rgba(216,180,106,.45)",
              borderRadius: 999,
              padding: "14px 24px",
              color: "#f3d28a",
              fontSize: 26,
              fontWeight: 700
            }}
          >
            للمصورين
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ maxWidth: 850, fontSize: 74, lineHeight: 1.12, fontWeight: 800 }}>
            كل صفحاتك وأسعارك وتفاصيلك في رابط واحد
          </div>
          <div style={{ maxWidth: 820, color: "rgba(255,255,255,.72)", fontSize: 32, lineHeight: 1.55 }}>
            موقع احترافي للمصور يعرض الصور والباقات وبيانات التواصل بشكل واضح وسهل المشاركة.
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: 18,
            alignItems: "center",
            color: "#f3d28a",
            fontSize: 28,
            fontWeight: 700
          }}
        >
          <span>معرض صور</span>
          <span>•</span>
          <span>باقات وأسعار</span>
          <span>•</span>
          <span>واتساب وحجز</span>
        </div>
      </div>
    ),
    size
  );
}
