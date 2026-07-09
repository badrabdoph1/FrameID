import type { Metadata } from "next";
import Link from "next/link";

import { AuthShell } from "@/components/layout/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signupAction } from "@/app/(marketing)/signup/actions";

export const metadata: Metadata = {
  title: "إنشاء حساب",
  description: "أنشئ حسابك على FrameID وابدأ تجهيز موقعك ورابطك الخاص.",
  robots: {
    index: false,
    follow: false
  }
};

type SignupPageProps = {
  searchParams: Promise<{
    error?: string;
    template?: string;
  }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const { error, template } = await searchParams;

  return (
    <AuthShell
      title="أنشئ حسابك"
      description="هنجهز الحساب والموقع والرابط تلقائيًا بعد التسجيل."
    >
      {error ? (
        <p className="mb-4 rounded-[var(--radius-panel)] border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-foreground">
          {error}
        </p>
      ) : null}
      <form action={signupAction} className="space-y-4">
        <input name="selectedTemplateCode" type="hidden" value={template ?? ""} />
        <div className="space-y-2">
          <Label htmlFor="name">اسمك أو اسم الاستوديو</Label>
          <Input id="name" name="name" autoComplete="name" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">البريد الإلكتروني</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">كلمة السر</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={10}
            required
          />
        </div>
        <Button type="submit" variant="luxury" className="w-full">
          إنشاء موقعي
        </Button>
      </form>
      <p className="mt-6 text-sm text-muted-foreground">
        عندك حساب؟{" "}
        <Link href="/login" className="font-semibold text-foreground">
          سجل دخول
        </Link>
      </p>
    </AuthShell>
  );
}
