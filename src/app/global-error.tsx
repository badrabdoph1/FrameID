"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <head>
        <title>خطأ غير متوقع | FrameID</title>
        <meta name="robots" content="noindex,nofollow" />
      </head>
      <body>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, fontFamily: "system-ui, sans-serif", background: "#0b0d12", color: "#fff", textAlign: "center" }}>
          <div style={{ maxWidth: 460, border: "1px solid rgba(255,255,255,.12)", borderRadius: 28, padding: 32, background: "rgba(255,255,255,.045)" }}>
            <div style={{ width: 56, height: 56, display: "grid", placeItems: "center", borderRadius: 999, margin: "0 auto 18px", background: "rgba(216,180,106,.14)", color: "#d8b46a" }}>
              <AlertTriangle size={28} aria-hidden />
            </div>
            <p style={{ margin: 0, color: "rgba(255,255,255,.58)", fontSize: 14, fontWeight: 700 }}>500</p>
            <h1 style={{ margin: "10px 0 0", fontSize: 30, lineHeight: 1.25 }}>حصل خطأ غير متوقع</h1>
            <p style={{ margin: "14px auto 0", color: "rgba(255,255,255,.68)", lineHeight: 1.8 }}>
              جرّب تحديث الصفحة أو ارجع للرئيسية. لو المشكلة مستمرة، تواصل مع الدعم.
            </p>
            {error.digest ? (
              <p style={{ margin: "14px 0 0", color: "rgba(255,255,255,.45)", fontSize: 12 }}>كود الخطأ: {error.digest}</p>
            ) : null}
            <div style={{ display: "grid", gap: 12, marginTop: 24 }}>
              <button
                onClick={reset}
                style={{ minHeight: 44, border: 0, borderRadius: 14, background: "#d8b46a", color: "#0b0d12", fontWeight: 800, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer" }}
              >
                <RefreshCw size={16} aria-hidden />
                جرب تاني
              </button>
              <Link
                href="/"
                style={{ minHeight: 44, borderRadius: 14, border: "1px solid rgba(255,255,255,.14)", color: "#fff", textDecoration: "none", fontWeight: 800, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}
              >
                <Home size={16} aria-hidden />
                الرئيسية
              </Link>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
