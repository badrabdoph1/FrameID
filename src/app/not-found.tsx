import type { Metadata } from "next";
import Link from "next/link";
import { Home, LayoutDashboard } from "lucide-react";

export const metadata: Metadata = {
  title: "الصفحة غير موجودة",
  description: "الصفحة المطلوبة غير موجودة أو لم تعد متاحة على FrameID.",
  robots: { index: false, follow: false }
};

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-6 py-16 text-center">
      <div className="max-w-md rounded-[var(--radius-panel)] border border-border bg-card p-6 shadow-soft md:p-8">
        <p className="text-sm font-semibold text-muted-foreground">404</p>
        <h1 className="mt-3 text-3xl font-semibold text-foreground">الصفحة غير موجودة</h1>
        <p className="mt-3 leading-7 text-muted-foreground">
          الرابط قد يكون تغير، أو الصفحة لم تعد متاحة، أو لا تملك صلاحية الوصول إليها.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-foreground px-5 text-sm font-semibold text-background transition hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Home className="size-4" aria-hidden />
            الرئيسية
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] border border-border bg-surface px-5 text-sm font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <LayoutDashboard className="size-4" aria-hidden />
            لوحة التحكم
          </Link>
        </div>
      </div>
    </main>
  );
}
