import { redirect } from "next/navigation";

import { updateSeoSettingsAction } from "@/app/(dashboard)/dashboard/settings/actions";
import { getCurrentRequestSession } from "@/modules/auth/request-session";
import { getPlatformBaseUrl } from "@/lib/platform-url";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { prisma } from "@/lib/prisma";

type DashboardSettingsPageProps = {
  searchParams: Promise<{
    updated?: string;
    error?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function DashboardSettingsPage({
  searchParams
}: DashboardSettingsPageProps) {
  const session = await getCurrentRequestSession();
  const { updated, error } = await searchParams;

  if (!session) {
    redirect("/login");
  }

  const seo = await prisma.sEOSettings.findUnique({
    where: {
      siteId: session.site.id
    }
  });

  return (
    <main className="space-y-5">
      <section>
        <Badge tone="neutral">Settings</Badge>
        <h1 className="mt-4 text-3xl font-semibold">الإعدادات</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          معلومات الحساب والموقع الأساسية.
        </p>
      </section>

      {updated ? (
        <p className="rounded-[var(--radius-panel)] border border-success/20 bg-success-soft px-4 py-3 text-sm text-success">
          تم تحديث إعدادات الموقع.
        </p>
      ) : null}

      {error ? (
        <p className="rounded-[var(--radius-panel)] border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger">
          راجع البيانات المطلوبة ثم حاول مرة أخرى.
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>الحساب</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>{session.user.name}</p>
            <p>{session.user.email}</p>
            <p>{session.user.role}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>الموقع</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>{session.site.title}</p>
            <p dir="ltr">{`${getPlatformBaseUrl()}/p/${session.site.slug}`}</p>
            <p>{session.site.status}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>SEO والمشاركة</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateSeoSettingsAction} className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="seo-title">عنوان البحث</Label>
                <Input
                  id="seo-title"
                  name="title"
                  defaultValue={seo?.title ?? session.site.title}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="canonical-url">الرابط الأساسي</Label>
                <Input
                  id="canonical-url"
                  name="canonicalUrl"
                  dir="ltr"
                  defaultValue={seo?.canonicalUrl ?? ""}
                  placeholder={`${getPlatformBaseUrl()}/p/${session.site.slug}`}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="seo-description">وصف البحث</Label>
              <textarea
                id="seo-description"
                name="description"
                rows={3}
                defaultValue={seo?.description ?? ""}
                className="w-full rounded-[var(--radius-control)] border border-border bg-surface px-3 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="robotsIndex"
                defaultChecked={seo?.robotsIndex ?? true}
              />
              السماح لمحركات البحث بأرشفة الموقع
            </label>
            <Button type="submit" variant="luxury">
              تحديث SEO
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
