"use client";

import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Copy,
  Eye,
  Send,
} from "lucide-react";

import type { DashboardViewModel } from "@/modules/dashboard/dashboard-view-model";
import {
  BuilderNotice,
  BuilderPageHeader,
  BuilderSectionCard,
  CompletionRing,
} from "@/components/dashboard/builder-primitives";

export function DashboardHomeClient({
  photographerName,
  siteSlug,
  siteUrl,
  statusLabel,
  percent,
  checklist,
  stats,
  lastModified,
  currentTheme,
  isPublished,
  nextStepHref,
  nextStepLabel,
  nextStepTitle,
  nextStepDescription,
}: DashboardViewModel) {
  const doneCount = checklist.filter((i) => i.done).length;
  const nextIsExternal = nextStepHref.startsWith("/p/");

  return (
    <main style={{ display: "grid", gap: 16, maxWidth: 980 }}>
      <BuilderPageHeader
        eyebrow={statusLabel}
        title={`مرحباً، ${photographerName}`}
        description="هذه لوحة بناء موقعك. اتبع الخطوات بالترتيب، وسنحفظ تغييراتك ونجهز الموقع للنشر."
        action={
          <Link
            href={`/p/${siteSlug}`}
            target="_blank"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] border border-border bg-surface px-4 text-sm font-semibold text-foreground"
          >
            <Eye className="size-4" aria-hidden />
            معاينة الموقع
          </Link>
        }
      />

      <section
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          alignItems: "stretch",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 16,
            alignItems: "center",
            borderRadius: 18,
            border: "1px solid rgba(243, 207, 115, 0.16)",
            background: "linear-gradient(135deg, rgba(243, 207, 115, 0.12), rgba(255,255,255,0.03))",
            padding: 18,
          }}
        >
          <CompletionRing percent={percent} />
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, color: "#f3cf73", fontSize: "0.78rem", fontWeight: 950 }}>
              {doneCount} من {checklist.length} خطوات مكتملة
            </p>
            <h2 style={{ margin: "6px 0", color: "#fff7e8", fontSize: "1.25rem", fontWeight: 950 }}>
              {nextStepTitle}
            </h2>
            <p style={{ margin: "0 0 14px", color: "rgba(245, 234, 214, 0.62)", fontSize: "0.85rem", lineHeight: 1.7 }}>
              {nextStepDescription}
            </p>
            <Link
              href={nextStepHref}
              target={nextIsExternal ? "_blank" : undefined}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                minHeight: 44,
                width: "100%",
                borderRadius: 12,
                background: "linear-gradient(135deg, #f3cf73, #d4af37)",
                color: "#17120a",
                fontSize: "0.9rem",
                fontWeight: 950,
                textDecoration: "none",
              }}
            >
              {percent === 100 && isPublished ? "تم النشر" : `أكمل الخطوة التالية: ${nextStepLabel}`}
              <ArrowLeft size={16} />
            </Link>
          </div>
        </div>

        <BuilderSectionCard
          title="ملخص الموقع"
          description={`آخر تعديل ${lastModified}. القالب الحالي: ${currentTheme}.`}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
            {stats.map((stat) => (
              <div
                key={stat.label}
                style={{
                  padding: 12,
                  borderRadius: 12,
                  border: "1px solid rgba(245, 234, 214, 0.07)",
                  background: "rgba(0,0,0,0.14)",
                }}
              >
                <p style={{ margin: 0, color: "rgba(245, 234, 214, 0.48)", fontSize: "0.72rem", fontWeight: 900 }}>
                  {stat.label}
                </p>
                <p
                  style={{
                    margin: "5px 0 0",
                    color: stat.tone === "success" ? "#4ade80" : stat.tone === "warning" ? "#f3cf73" : "#fff7e8",
                    fontSize: "1.1rem",
                    fontWeight: 950,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </BuilderSectionCard>
      </section>

      <BuilderSectionCard
        title="خطوات بناء الموقع"
        description="اتبعها كرحلة واحدة: بياناتك، أعمالك، أسعارك، الشكل، المراجعة، ثم النشر."
      >
        <div style={{ display: "grid", gap: 8 }}>
          {checklist.map((item, index) => (
            <Link
              key={item.id}
              href={item.href}
              target={item.id === "review" ? "_blank" : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 11,
                minHeight: 48,
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(245, 234, 214, 0.06)",
                background: item.done ? "rgba(74, 222, 128, 0.045)" : "rgba(255,255,255,0.025)",
                color: item.done ? "rgba(245, 234, 214, 0.55)" : "#fff7e8",
                textDecoration: "none",
              }}
            >
              <span style={{ color: item.done ? "#4ade80" : "rgba(245, 234, 214, 0.22)", flexShrink: 0 }}>
                {item.done ? <CheckCircle2 size={20} /> : <Circle size={20} />}
              </span>
              <span style={{ color: "rgba(245, 234, 214, 0.38)", fontSize: "0.72rem", fontWeight: 950 }}>
                {index + 1}
              </span>
              <span style={{ fontSize: "0.88rem", fontWeight: 920 }}>
                {item.label}
              </span>
              <ArrowLeft size={14} style={{ marginRight: "auto", color: "rgba(245, 234, 214, 0.25)" }} />
            </Link>
          ))}
        </div>
      </BuilderSectionCard>

      <BuilderNotice
        tone={isPublished ? "success" : "info"}
        title={isPublished ? "موقعك منشور ويمكن مشاركته" : "موقعك ما زال مسودة"}
        description={isPublished ? siteUrl : "أكمل الخطوات الأساسية ثم راجع صفحة النشر والمشاركة."}
      />

      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <Link href="/dashboard/publish" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-champagne px-4 text-sm font-bold text-amber-950">
          <Send className="size-4" aria-hidden />
          نشر ومشاركة
        </Link>
        <button
          type="button"
          onClick={() => navigator.clipboard?.writeText(siteUrl)}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] border border-border bg-surface px-4 text-sm font-semibold text-foreground"
        >
          <Copy className="size-4" aria-hidden />
          نسخ الرابط
        </button>
      </div>
    </main>
  );
}
