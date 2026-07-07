"use client";

import type { DashboardViewModel } from "@/modules/dashboard/dashboard-view-model";
import { ArrowLeft, ExternalLink, FileText, Images, BriefcaseBusiness, Settings, Palette, CreditCard } from "lucide-react";
import Link from "next/link";

import { DashboardSiteActions } from "@/components/dashboard/dashboard-site-actions";
import { SlugEditor } from "@/components/dashboard/slug-editor";

const iconMap: Record<string, typeof FileText> = {
  "بيانات الموقع": FileText,
  "المعرض": Images,
  "الباقات والخدمات": BriefcaseBusiness,
  "SEO والتواصل": Settings,
  "القالب": Palette,
  "التفعيل": CreditCard,
};

type DashboardContentProps = DashboardViewModel & {
  slugChanged?: string;
  slugError?: string;
};

export function DashboardContent({
  photographerName,
  statusLabel,
  siteSlug,
  siteUrl,
  slugChangeUsed,
  slugChanged,
  slugError,
  widgets,
  controlAreas,
}: DashboardContentProps) {
  return (
    <div style={{ display: "grid", gap: 18 }}>
      {/* Hero */}
      <div className="admin-hero-panel">
        <div>
          <span className="eyebrow" style={{ color: "#f3cf73", fontSize: "0.78rem", fontWeight: 950 }}>
            {statusLabel}
          </span>
          <h1>مرحباً، {photographerName}</h1>
          <p>موقعك في FrameID جاهز. رابطك، حالتك، وتحكم في محتواك من مكان واحد.</p>
          <div className="admin-hero-actions" style={{ marginTop: 16 }}>
            <Link href="/dashboard/content" className="btn-gold">
              <FileText size={17} />
              تعديل المحتوى
            </Link>
            <Link href={`/p/${siteSlug}`} className="btn-soft" target="_blank">
              <ExternalLink size={17} />
              معاينة الموقع
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        {widgets.map((widget) => (
          <div
            key={widget.label}
            style={{
              padding: 18,
              borderRadius: 14,
              border: "1px solid rgba(245, 234, 214, 0.09)",
              background: "rgba(255, 255, 255, 0.035)",
              display: "grid",
              gap: 6,
            }}
          >
            <span style={{ color: "rgba(245, 234, 214, 0.6)", fontSize: "0.82rem", fontWeight: 900 }}>
              {widget.label}
            </span>
            <strong style={{ color: "#fff7e8", fontSize: "1.8rem", lineHeight: 1 }}>
              {widget.value}
            </strong>
            <span style={{
              fontSize: "0.72rem",
              fontWeight: 950,
              color: widget.tone === "success" ? "#4ade80" : widget.tone === "warning" ? "#f3cf73" : "rgba(245, 234, 214, 0.5)",
            }}>
              {widget.tone === "success" ? "مباشر" : widget.tone === "warning" ? "معلق" : "غير متاح"}
            </span>
          </div>
        ))}
      </div>

      {/* Two-column: Control Areas + Side Info */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14, alignItems: "start" }}>
        {/* Control Areas */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
          {controlAreas.map((area) => {
            const Icon = iconMap[area.label] ?? ExternalLink;
            return (
              <Link
                key={area.href}
                href={area.href}
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr auto",
                  alignItems: "center",
                  gap: 12,
                  minHeight: 100,
                  padding: 16,
                  borderRadius: 16,
                  border: "1px solid rgba(245, 234, 214, 0.1)",
                  background: "linear-gradient(145deg, rgba(24, 27, 34, 0.92), rgba(15, 17, 22, 0.86)), radial-gradient(circle at 12% 0%, rgba(201, 155, 71, 0.08), transparent 12rem)",
                  color: "#f5ead6",
                  textDecoration: "none",
                  transition: "transform 0.16s, border-color 0.16s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.borderColor = "rgba(243, 207, 115, 0.26)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "";
                  e.currentTarget.style.borderColor = "rgba(245, 234, 214, 0.1)";
                }}
              >
                <div style={{
                  width: 42,
                  height: 42,
                  borderRadius: 14,
                  display: "grid",
                  placeItems: "center",
                  background: "rgba(243, 207, 115, 0.1)",
                  color: "#f3cf73",
                  flexShrink: 0,
                }}>
                  <Icon size={18} />
                </div>
                <div style={{ display: "grid", gap: 3, minWidth: 0 }}>
                  <strong style={{ color: "#fff7e8", fontSize: "0.9rem" }}>{area.label}</strong>
                  <small style={{ color: "rgba(245, 234, 214, 0.62)", fontSize: "0.75rem", fontWeight: 850, lineHeight: 1.45 }}>{area.description}</small>
                </div>
                <ArrowLeft size={15} style={{ color: "rgba(245, 234, 214, 0.4)", flexShrink: 0 }} />
              </Link>
            )
          })}
        </div>

        {/* Side info */}
        <div style={{ display: "grid", gap: 12, alignContent: "start" }}>
          <div style={{ borderRadius: 14, border: "1px solid rgba(245, 234, 214, 0.09)", background: "rgba(255, 255, 255, 0.035)", display: "grid", gap: 14, padding: 16 }}>
            <h3 style={{ margin: 0, color: "#fff7e8", fontSize: "0.95rem" }}>رابط الموقع</h3>
            <div style={{ borderRadius: 10, background: "rgba(245, 234, 214, 0.06)", padding: "12px 14px", direction: "ltr", textAlign: "left", fontSize: "0.85rem", fontFamily: "monospace", color: "rgba(245, 234, 214, 0.78)", wordBreak: "break-all" }}>
              {siteUrl}
            </div>
            <DashboardSiteActions siteUrl={siteUrl} />
            <SlugEditor
              currentSlug={siteSlug}
              disabled={slugChangeUsed}
              changed={slugChanged === "1"}
              error={slugError}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
