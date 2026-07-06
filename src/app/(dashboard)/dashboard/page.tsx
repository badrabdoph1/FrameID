import Link from "next/link";
import { redirect } from "next/navigation";
import { ExternalLink } from "lucide-react";

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
                  <Badge tone={widget.tone}>مباشر</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
