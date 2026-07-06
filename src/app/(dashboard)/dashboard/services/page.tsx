import { redirect } from "next/navigation";
import { BriefcaseBusiness, CirclePlus } from "lucide-react";

import {
  addExtraAction,
  addPackageAction
} from "@/app/(dashboard)/dashboard/services/actions";
import { prisma } from "@/lib/prisma";
import { getCurrentRequestSession } from "@/modules/auth/request-session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ServicesPageProps = {
  searchParams: Promise<{
    created?: string;
    error?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function DashboardServicesPage({
  searchParams
}: ServicesPageProps) {
  const session = await getCurrentRequestSession();
  const { created, error } = await searchParams;

  if (!session) {
    redirect("/login");
  }

  const [packages, extras] = await Promise.all([
    prisma.package.findMany({
      where: {
        siteId: session.site.id,
        deletedAt: null
      },
      orderBy: {
        sortOrder: "asc"
      }
    }),
    prisma.extraService.findMany({
      where: {
        siteId: session.site.id,
        deletedAt: null
      },
      orderBy: {
        sortOrder: "asc"
      }
    })
  ]);

  return (
    <main className="space-y-5">
      <section>
        <Badge tone="luxury">Services</Badge>
        <h1 className="mt-4 text-3xl font-semibold">الباقات والخدمات</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          أضف عروض التصوير والخدمات الإضافية التي تظهر داخل موقعك.
        </p>
      </section>

      {created ? (
        <p className="rounded-[var(--radius-panel)] border border-success/20 bg-success-soft px-4 py-3 text-sm text-success">
          تم تحديث الخدمات على موقعك.
        </p>
      ) : null}

      {error ? (
        <p className="rounded-[var(--radius-panel)] border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger">
          راجع الاسم والسعر ثم حاول مرة أخرى.
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>إضافة باقة</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={addPackageAction} className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="package-name">اسم الباقة</Label>
                <Input id="package-name" name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="package-subtitle">وصف مختصر</Label>
                <Input id="package-subtitle" name="subtitle" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="package-price">السعر بالجنيه</Label>
                <Input id="package-price" name="priceAmount" inputMode="numeric" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="package-features">المميزات</Label>
                <textarea
                  id="package-features"
                  name="features"
                  rows={4}
                  className="w-full rounded-[var(--radius-control)] border border-border bg-surface px-3 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="ميزة في كل سطر"
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="isHighlighted" />
                تمييز هذه الباقة
              </label>
              <Button type="submit" variant="luxury">
                <CirclePlus className="size-4" aria-hidden />
                إضافة الباقة
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>إضافة خدمة إضافية</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={addExtraAction} className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="extra-name">اسم الخدمة</Label>
                <Input id="extra-name" name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="extra-price">السعر بالجنيه</Label>
                <Input id="extra-price" name="priceAmount" inputMode="numeric" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="extra-icon">رمز داخلي</Label>
                <Input id="extra-icon" name="iconKey" placeholder="album, reel, prints" />
              </div>
              <Button type="submit" variant="luxury">
                <BriefcaseBusiness className="size-4" aria-hidden />
                إضافة الخدمة
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>الباقات الحالية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {packages.length ? (
              packages.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[var(--radius-panel)] border border-border p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <strong>{item.name}</strong>
                    <span className="text-sm text-muted-foreground">
                      {formatMoney(item.priceAmount, item.currency)}
                    </span>
                  </div>
                  {item.subtitle ? (
                    <p className="mt-1 text-sm text-muted-foreground">{item.subtitle}</p>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">لا توجد باقات بعد.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>الخدمات الحالية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {extras.length ? (
              extras.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-[var(--radius-panel)] border border-border p-4"
                >
                  <strong>{item.name}</strong>
                  <span className="text-sm text-muted-foreground">
                    {formatMoney(item.priceAmount, item.currency)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">لا توجد خدمات إضافية بعد.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function formatMoney(amount: number, currency: string): string {
  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0
  }).format(amount)} ${currency}`;
}
