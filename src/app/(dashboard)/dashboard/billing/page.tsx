import { redirect } from "next/navigation";

import { requestActivationAction } from "@/app/(dashboard)/dashboard/billing/actions";
import { getCurrentRequestSession } from "@/modules/auth/request-session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type BillingPageProps = {
  searchParams: Promise<{
    requested?: string;
    error?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const session = await getCurrentRequestSession();
  const { requested, error } = await searchParams;

  if (!session) {
    redirect("/login");
  }

  return (
    <main className="space-y-5">
      <section>
        <Badge tone={session.subscription?.status === "ACTIVE" ? "success" : "warning"}>
          {session.subscription?.status ?? session.tenant.status}
        </Badge>
        <h1 className="mt-4 text-3xl font-semibold">تفعيل موقعي</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          لا يوجد دفع قبل التجربة. عند الاستعداد، أرسل بيانات الدفع وسنراجعها من لوحة الإدارة.
        </p>
      </section>

      {requested ? (
        <p className="rounded-[var(--radius-panel)] border border-success/20 bg-success-soft px-4 py-3 text-sm text-success">
          تم إرسال طلب التفعيل. سنراجع الدفع ونفعّل الموقع بعد التأكد.
        </p>
      ) : null}

      {error ? (
        <p className="rounded-[var(--radius-panel)] border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger">
          تعذر إرسال طلب التفعيل. راجع البيانات وحاول مرة أخرى.
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>طلب تفعيل يدوي</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={requestActivationAction} className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="rounded-[var(--radius-panel)] border border-border p-4">
                <input
                  type="radio"
                  name="method"
                  value="INSTAPAY"
                  className="me-2"
                  defaultChecked
                />
                InstaPay
              </label>
              <label className="rounded-[var(--radius-panel)] border border-border p-4">
                <input
                  type="radio"
                  name="method"
                  value="VODAFONE_CASH"
                  className="me-2"
                />
                Vodafone Cash
              </label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference">رقم العملية أو ملاحظة الدفع</Label>
              <Input id="reference" name="reference" placeholder="مثال: رقم العملية أو اسم المحوّل" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="proof">إثبات الدفع</Label>
              <Input
                id="proof"
                name="proof"
                type="file"
                accept="image/jpeg,image/png,image/webp"
              />
            </div>

            <Button type="submit" variant="luxury">
              تفعيل موقعي
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
