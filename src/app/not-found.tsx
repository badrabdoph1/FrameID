import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "الصفحة مش موجودة",
  robots: { index: false, follow: false }
};

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-6 text-center">
      <div className="max-w-md space-y-5">
        <p className="text-sm font-medium text-muted-foreground">404</p>
        <h1 className="text-3xl font-semibold">الصفحة مش موجودة</h1>
        <p className="text-muted-foreground">
          الرابط ممكن يكون اتغير أو الصفحة مش متاحة دلوقتي.
        </p>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-control)] bg-foreground px-5 text-sm font-semibold text-background"
        >
          العودة للرئيسية
        </Link>
      </div>
    </main>
  );
}
