import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "linear-gradient(135deg,#070707 0%,#17120b 56%,#d8b46a 160%)", color: "white", padding: 72, direction: "rtl" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 42, fontWeight: 700 }}>FrameID</div>
        <div style={{ border: "1px solid rgba(216,180,106,.45)", borderRadius: 999, padding: "14px 24px", color: "#f3d28a", fontSize: 26, fontWeight: 700 }}>للمصورين</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ maxWidth: 850, fontSize: 74, lineHeight: 1.12, fontWeight: 800 }}>كل صفحاتك وأسعارك وتفاصيلك في رابط واحد</div>
        <div style={{ maxWidth: 820, color: "rgba(255,255,255,.72)", fontSize: 32, lineHeight: 1.55 }}>موقع احترافي للمصور يعرض الصور والباقات وبيانات التواصل بشكل واضح وسهل المشاركة.</div>
      </div>
      <div style={{ display: "flex", gap: 18, color: "#f3d28a", fontSize: 28, fontWeight: 700 }}><span>معرض صور</span><span>•</span><span>باقات وأسعار</span><span>•</span><span>واتساب وحجز</span></div>
    </div>,
    { width: 1200, height: 630 },
  );
}
