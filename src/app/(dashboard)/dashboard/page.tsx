import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { getPlatformBaseUrl } from "@/lib/platform-url";
import { getCurrentRequestSession } from "@/modules/auth/request-session";
import { createDashboardViewModel } from "@/modules/dashboard/dashboard-view-model";
import { DashboardSiteActions } from "@/components/dashboard/dashboard-site-actions";
import { SlugEditor } from "@/components/dashboard/slug-editor";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

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
    <main>
      <section className="py-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Badge tone="warning">{dashboard.statusLabel}</Badge>
            <h1 className="mt-4 text-3xl font-semibold">
              مركز موقع {dashboard.photographerName}
            </h1>
            <p className="mt-2 text-muted-foreground">
              رابطك، حالتك، وآخر ما يحتاج انتباهك في شاشة واحدة.
            </p>
          </div>
          <Link
            href={`/p/${dashboard.siteSlug}`}
            className="hidden min-h-11 items-center gap-2 rounded-[var(--radius-control)] border border-border bg-surface px-4 text-sm font-semibold md:inline-flex"
          >
            <ExternalLink className="size-4" aria-hidden />
            فتح الموقع
          </Link>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
          <Card>
            <CardHeader>
              <CardTitle>رابط الموقع</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-[var(--radius-panel)] bg-muted p-4 text-left font-medium" dir="ltr">
                {dashboard.siteUrl}
              </div>
              <DashboardSiteActions siteUrl={dashboard.siteUrl} />
              <SlugEditor
                currentSlug={dashboard.siteSlug}
                disabled={dashboard.slugChangeUsed}
                changed={slugChanged === "1"}
                error={slugError}
              />
            </CardContent>
          </Card>

          <div className="grid gap-4">
            {dashboard.widgets.map((widget) => (
              <Card key={widget.label}>
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">
                    {widget.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <span className="text-2xl font-semibold">{widget.value}</span>
                  <Badge tone={widget.tone}>{widget.tone === "success" ? "مباشر" : widget.tone === "warning" ? "معلق" : "غير متاح"}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <section className="mt-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">تحكم في موقعك من مكان واحد</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                هذه ليست لوحة إدارة المنصة؛ هذه مساحة المصور لتعديل موقعه فقط.
              </p>
            </div>
            <Link
              href={`/p/${dashboard.siteSlug}`}
              className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-champagne-strong md:hidden"
            >
              فتح الموقع
              <ExternalLink className="size-4" aria-hidden />
            </Link>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {dashboard.controlAreas.map((area) => (
              <Link
                key={area.href}
                href={area.href}
                className="group rounded-[var(--radius-card)] border border-border bg-surface p-4 transition hover:border-champagne hover:shadow-soft"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold">{area.label}</h3>
                  <ArrowLeft
                    className="size-4 text-muted-foreground transition group-hover:-translate-x-1 group-hover:text-champagne-strong"
                    aria-hidden
                  />
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {area.description}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
