"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { captureClientError, reportCapturedError } from "@/lib/client/error-reporting";

export function GlobalErrorExperience({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const capturePromise = useRef<Promise<string | null> | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "failed">("idle");
  const [issueNumber, setIssueNumber] = useState<string | null>(null);

  useEffect(() => {
    capturePromise.current ??= captureClientError(error);
  }, [error]);

  const report = async () => {
    if (status === "sending" || status === "sent") return;
    setStatus("sending");
    try {
      capturePromise.current ??= captureClientError(error);
      const occurrenceId = await capturePromise.current;
      if (!occurrenceId) throw new Error("capture-failed");
      const result = await reportCapturedError(occurrenceId);
      setIssueNumber(result.issueNumber);
      setStatus("sent");
    } catch {
      setStatus("failed");
    }
  };

  const buttonBase = {
    minHeight: 48,
    borderRadius: 16,
    padding: "0 20px",
    fontWeight: 800,
    fontSize: 14,
    cursor: "pointer",
  } as const;

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 20, background: "#f7f4ee", color: "#111", fontFamily: "system-ui, sans-serif", direction: "rtl" }}>
      <section aria-labelledby="global-error-title" style={{ width: "min(100%, 560px)", padding: "36px 28px", border: "1px solid #ded7ca", borderRadius: 32, background: "#fffdfa", textAlign: "center", boxShadow: "0 28px 90px rgba(16,16,16,.11)" }}>
        <div aria-hidden style={{ width: 76, height: 76, display: "grid", placeItems: "center", margin: "0 auto", borderRadius: 999, background: "#f3e7c9", color: "#765216", fontSize: 30 }}>✦</div>
        <p style={{ margin: "24px 0 0", color: "#765216", fontSize: 12, fontWeight: 800 }}>تحديث بسيط</p>
        <h1 id="global-error-title" style={{ margin: "12px 0 0", fontSize: "clamp(28px,6vw,40px)", lineHeight: 1.25 }}>بنجهّز لك تجربة أحسن</h1>
        <p style={{ margin: "16px auto 0", maxWidth: 430, color: "#6f6a61", fontSize: 16, lineHeight: 1.8 }}>في تحديث دلوقتي في الموقع، بنضيف لكم مميزات جديدة وبنطوّر الخدمات. جرّب تاني بعد لحظات.</p>
        <div style={{ display: "grid", gap: 12, marginTop: 28 }}>
          <button type="button" onClick={() => onRetry ? onRetry() : window.location.reload()} style={{ ...buttonBase, border: 0, background: "#111", color: "#fff" }}>إعادة المحاولة</button>
          <Link href="/" style={{ ...buttonBase, display: "grid", placeItems: "center", boxSizing: "border-box", border: "1px solid #ded7ca", background: "#fff", color: "#111", textDecoration: "none" }}>الصفحة الرئيسية</Link>
          <button type="button" onClick={() => void report()} disabled={status === "sending" || status === "sent"} style={{ ...buttonBase, border: "1px solid #d8b46a", background: "#f3e7c9", color: "#765216" }}>
            {status === "sending" ? "جاري إرسال البلاغ…" : status === "sent" ? "تم إبلاغ الإدارة" : "إبلاغ الإدارة بالمشكلة"}
          </button>
        </div>
        {status === "sent" && issueNumber ? <p role="status" style={{ color: "#207a50", fontWeight: 800 }}>تم إرسال البلاغ {issueNumber}</p> : null}
        {status === "failed" ? <p role="status" style={{ color: "#946200", fontWeight: 800 }}>تعذر الإرسال دلوقتي. جرّب بعد لحظات.</p> : null}
      </section>
    </main>
  );
}
