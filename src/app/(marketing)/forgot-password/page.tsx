import { requestPasswordResetAction } from "@/app/(marketing)/forgot-password/actions";
import { AuthShell } from "@/components/layout/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ForgotPasswordPageProps = {
  searchParams: Promise<{
    sent?: string;
  }>;
};

export default async function ForgotPasswordPage({
  searchParams
}: ForgotPasswordPageProps) {
  const { sent } = await searchParams;

  return (
    <AuthShell
      title="استعادة كلمة المرور"
      description="أدخل بريدك وسنرسل رابطًا آمنًا إذا كان الحساب موجودًا."
    >
      {sent ? (
        <p className="mb-4 rounded-[var(--radius-panel)] border border-success/20 bg-success-soft px-4 py-3 text-sm text-success">
          إذا كان البريد مسجلًا، تم تجهيز رابط الاستعادة عبر قناة الإرسال
          المتاحة.
        </p>
      ) : null}
      <form action={requestPasswordResetAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">البريد الإلكتروني</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <Button type="submit" className="w-full">
          إرسال رابط الاستعادة
        </Button>
      </form>
    </AuthShell>
  );
}
