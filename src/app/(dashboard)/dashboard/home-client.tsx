"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Copy,
  CreditCard,
  Eye,
  Hourglass,
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
  subscription,
}: DashboardViewModel) {
  const doneCount = checklist.filter((i) => i.done).length;
  const nextIsExternal = nextStepHref.startsWith("/p/");
  const [copied, setCopied] = useState(false);

  const copySiteUrl = async () => {
    await navigator.clipboard?.writeText(siteUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <main style={{ display: "grid", gap: 16, maxWidth: 980 }}>
      <BuilderPageHeader
        eyebrow={statusLabel}
        title={`مرحباً بيك، ${photographerName}`}
        description="دي لوحة بناء موقعك. اتبع الخطوات بالترتيب واحنا هنحفظ تغييراتك ونجهز الموقع للنشر."
        action={
          <Link
            href={`/p/${siteSlug}`}
            target="_blank"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] border border-border bg-surface px-4 text-sm font-semibold text-foreground"
          >
            <Eye className="size-4" aria-hidden />
            شوف الموقع
          </Link>
        }
      />

      {subscription ? (() => {
        const badge = (text: string, color: string, bg: string) => (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "3px 10px",
              borderRadius: 20,
              fontSize: "0.72rem",
              fontWeight: 950,
              color,
              background: bg,
            }}
          >
            {text}
          </span>
        );

        const actionBtn = (label: string, color: string, href: string) => (
          <Link
            href={href}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              minHeight: 40,
              padding: "0 18px",
              borderRadius: 12,
              background: color,
              color: "#17120a",
              fontSize: "0.85rem",
              fontWeight: 950,
              textDecoration: "none",
            }}
          >
            {label}
          </Link>
        );

        if (subscription.hasPendingRequest) {
          return (
            <BuilderSectionCard
              title="حالة الاشتراك"
              description=""
              icon={<Hourglass size={16} />}
              status={badge("قيد المراجعة", "#fbbf24", "rgba(251, 191, 36, 0.12)")}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <p style={{ margin: 0, color: "#fff7e8", fontSize: "0.88rem", fontWeight: 950 }}>
                    طلب التفعيل قيد المراجعة
                  </p>
                  <p style={{ margin: "4px 0 0", color: "rgba(245, 234, 214, 0.5)", fontSize: "0.78rem" }}>
                    حالة الطلب: {subscription.pendingRequestStatus === "SUBMITTED" ? "تم الإرسال" : subscription.pendingRequestStatus === "PENDING" ? "قيد الانتظار" : "قيد المراجعة"}
                  </p>
                </div>
                {actionBtn("متابعة الطلب", "linear-gradient(135deg, #fbbf24, #f59e0b)", "/dashboard/billing")}
              </div>
            </BuilderSectionCard>
          );
        }

        if (subscription.isTrial) {
          const urgent = subscription.daysRemaining !== null && subscription.daysRemaining <= 3;
          return (
            <BuilderSectionCard
              title="اشتراك تجريبي"
              description=""
              icon={<Hourglass size={16} />}
              status={badge(
                urgent ? `${subscription.daysRemaining} أيام متبقية` : "تجريبي",
                urgent ? "#ef4444" : "#f3cf73",
                urgent ? "rgba(239, 68, 68, 0.12)" : "rgba(243, 207, 115, 0.12)",
              )}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <p style={{ margin: 0, color: "#fff7e8", fontSize: "1.25rem", fontWeight: 950 }}>
                    {subscription.daysRemaining !== null ? `${subscription.daysRemaining} يوم` : "—"}
                  </p>
                  <p style={{ margin: "4px 0 0", color: "rgba(245, 234, 214, 0.5)", fontSize: "0.78rem" }}>
                    متبقي من الفترة التجريبية
                    {subscription.trialEndsAt ? ` — تنتهي ${new Date(subscription.trialEndsAt).toLocaleDateString("ar-EG")}` : ""}
                  </p>
                  {urgent ? (
                    <p style={{ margin: "6px 0 0", color: "#ef4444", fontSize: "0.78rem", fontWeight: 950 }}>
                      الفترة التجريبية على وشك الانتهاء، فعّل اشتراكك الآن
                    </p>
                  ) : null}
                </div>
                {actionBtn("فعّل اشتراكك الآن", "linear-gradient(135deg, #f3cf73, #d4af37)", "/dashboard/billing")}
              </div>
            </BuilderSectionCard>
          );
        }

        if (subscription.isActive) {
          return (
            <BuilderSectionCard
              title="الاشتراك"
              description=""
              icon={<CreditCard size={16} />}
              status={badge("مشترك", "#4ade80", "rgba(74, 222, 128, 0.12)")}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <p style={{ margin: 0, color: "#fff7e8", fontSize: "0.88rem", fontWeight: 950 }}>
                    {subscription.planName ? subscription.planName : "اشتراك نشط"}
                  </p>
                  <p style={{ margin: "4px 0 0", display: "flex", alignItems: "center", gap: 5, color: "#4ade80", fontSize: "0.78rem" }}>
                    <CheckCircle2 size={14} />
                    اشتراك نشط
                  </p>
                </div>
                {actionBtn("إدارة الاشتراك", "linear-gradient(135deg, #4ade80, #22c55e)", "/dashboard/billing")}
              </div>
            </BuilderSectionCard>
          );
        }

        if (subscription.isExpired) {
          return (
            <BuilderSectionCard
              title="الاشتراك"
              description=""
              icon={<CreditCard size={16} />}
              status={badge("منتهي", "#ef4444", "rgba(239, 68, 68, 0.12)")}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <p style={{ margin: 0, color: "#fff7e8", fontSize: "0.88rem", fontWeight: 950 }}>
                    انتهت فترة التجربة
                  </p>
                  <p style={{ margin: "4px 0 0", color: "rgba(245, 234, 214, 0.5)", fontSize: "0.78rem" }}>
                    لم يعد الاشتراك نشطاً، فعّله الآن لاستعادة الميزات
                  </p>
                </div>
                {actionBtn("فعّل الآن", "linear-gradient(135deg, #ef4444, #dc2626)", "/dashboard/billing")}
              </div>
            </BuilderSectionCard>
          );
        }

        return null;
      })() : null}

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
              {doneCount} من {checklist.length} خطوات تمت
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
              {percent === 100 && isPublished ? "تم النشر" : `كمل الخطوة الجاية: ${nextStepLabel}`}
              <ArrowLeft size={16} />
            </Link>
          </div>
        </div>

        <BuilderSectionCard
          title="ملخص الموقع"
          description={`آخر تعديل: ${lastModified}. القالب: ${currentTheme}.`}
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
        description="اتبعها بالترتيب: بياناتك، أعمالك، أسعارك، الشكل، المراجعة، ثم النشر."
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
        title={isPublished ? "موقعك منشور وجاهز للمشاركة" : "موقعك لسه مسودة"}
        description={isPublished ? siteUrl : "كمل الخطوات الأساسية وبعدين راجع صفحة النشر والمشاركة."}
      />

      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <Link href="/dashboard/publish" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-champagne px-4 text-sm font-bold text-amber-950">
          <Send className="size-4" aria-hidden />
          نشر ومشاركة
        </Link>
        <button
          type="button"
          onClick={copySiteUrl}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] border border-border bg-surface px-4 text-sm font-semibold text-foreground"
        >
          {copied ? <CheckCircle2 className="size-4 text-success" aria-hidden /> : <Copy className="size-4" aria-hidden />}
          {copied ? "تم نسخ الرابط" : "نسخ الرابط"}
        </button>
      </div>
    </main>
  );
}
