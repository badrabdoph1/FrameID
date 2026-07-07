import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ExternalLink, FileText, Images, BriefcaseBusiness, Settings, Palette, CreditCard } from "lucide-react";

import { getPlatformBaseUrl } from "@/lib/platform-url";
import { getCurrentRequestSession } from "@/modules/auth/request-session";
import { createDashboardViewModel } from "@/modules/dashboard/dashboard-view-model";
import { DashboardSiteActions } from "@/components/dashboard/dashboard-site-actions";
import { SlugEditor } from "@/components/dashboard/slug-editor";

export const dynamic = "force-dynamic";

const iconMap: Record<string, typeof FileText> = {
  "بيانات الموقع": FileText,
  "المعرض": Images,
  "الباقات والخدمات": BriefcaseBusiness,
  "SEO والتواصل": Settings,
  "القالب": Palette,
  "التفعيل": CreditCard,
};

type DashboardPageProps = {
  searchParams: Promise<{
    slugChanged?: string;
    slugError?: string;
  }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const { slugChanged, slugError } = await searchParams;
  const session = await getCurrentRequestSession();

  if (!session) {
    redirect("/login");
  }

  const dashboard = createDashboardViewModel({
    session,
    platformBaseUrl: getPlatformBaseUrl(),
    now: new Date()
  });

  return (
    <div className="admin-page-shell">
      {/* Head */}
      <div className="dashboard-head">
        <div>
          <span className="eyebrow" style={{ marginBottom: 4, display: "inline-flex" }}>
            {dashboard.statusLabel}
          </span>
          <h1>مركز موقع {dashboard.photographerName}</h1>
          <p>رابطك، حالتك، وآخر ما يحتاج انتباهك في شاشة واحدة.</p>
        </div>
        <div className="dashboard-actions">
          <Link href={`/p/${dashboard.siteSlug}`} className="btn-soft">
            <ExternalLink className="size-4" />
            فتح الموقع
          </Link>
        </div>
      </div>

      {/* Hero Panel */}
      <div className="admin-hero-panel">
        <div>
          <span className="eyebrow" style={{ color: "#f3cf73", fontSize: "0.78rem", fontWeight: 950 }}>
            لوحة المصور
          </span>
          <h1>مرحباً، {dashboard.photographerName}</h1>
          <p>موقعك في FrameID جاهز. تابع حالتك وتحكم في محتواك من مكان واحد.</p>
          <div className="admin-hero-actions" style={{ marginTop: 16 }}>
            <Link href="/dashboard/content" className="btn-gold">
              <FileText size={17} />
              تعديل المحتوى
            </Link>
            <Link href={`/p/${dashboard.siteSlug}`} className="btn-soft" target="_blank">
              <ExternalLink size={17} />
              معاينة الموقع
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {dashboard.widgets.map((widget) => (
          <div key={widget.label} className="stat-card" style={{ border: "1px solid rgba(245, 234, 214, 0.09)", borderRadius: 14, background: "rgba(255, 255, 255, 0.035)" }}>
            <span>{widget.label}</span>
            <strong>{widget.value}</strong>
            <span style={{
              display: "inline-block",
              marginTop: 6,
              fontSize: "0.72rem",
              fontWeight: 950,
              color: widget.tone === "success" ? "#4ade80" : widget.tone === "warning" ? "#f3cf73" : "rgba(245, 234, 214, 0.5)",
            }}>
              {widget.tone === "success" ? "مباشر" : widget.tone === "warning" ? "معلق" : "غير متاح"}
            </span>
          </div>
        ))}
      </div>

      {/* Start Grid + Side Column */}
      <div className="admin-home-grid">
        {/* Start Cards */}
        <div>
          <div className="admin-start-grid">
            {dashboard.controlAreas.map((area) => {
              const Icon = iconMap[area.label] ?? ExternalLink;
              return (
                <Link key={area.href} href={area.href} className="admin-start-card">
                  <Icon size={18} />
                  <span>
                    <strong>{area.label}</strong>
                    <small>{area.description}</small>
                  </span>
                  <ArrowLeft size={16} />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Side Column */}
        <div style={{ display: "grid", alignContent: "start", gap: 14 }}>
          <div style={{ border: "1px solid rgba(245, 234, 214, 0.09)", borderRadius: 14, background: "rgba(255, 255, 255, 0.035)", display: "grid", gap: 14, padding: 14 }}>
            <h3 style={{ margin: 0, color: "#fff7e8", fontSize: "0.95rem" }}>رابط الموقع</h3>
            <div style={{ borderRadius: 10, background: "rgba(245, 234, 214, 0.06)", padding: "12px 14px", direction: "ltr", textAlign: "left", fontSize: "0.85rem", fontFamily: "monospace", color: "rgba(245, 234, 214, 0.78)", wordBreak: "break-all" }}>
              {dashboard.siteUrl}
            </div>
            <DashboardSiteActions siteUrl={dashboard.siteUrl} />
            <SlugEditor
              currentSlug={dashboard.siteSlug}
              disabled={dashboard.slugChangeUsed}
              changed={slugChanged === "1"}
              error={slugError}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
