import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { MarketingFooter } from "@/components/layout/marketing-footer";
import { MarketingNav } from "@/components/layout/marketing-nav";
import { getContent } from "@/lib/content";

export const metadata: Metadata = {
  title: "سياسة الخصوصية",
  description: "سياسة خصوصية FrameID للمصورين: البيانات التي نجمعها، كيفية استخدامها، حذف الحساب، النسخ الاحتياطي، والتحليلات.",
  alternates: {
    canonical: "/privacy"
  },
  openGraph: {
    title: "سياسة الخصوصية | FrameID",
    description: "تعرف على طريقة تعامل FrameID مع بيانات الحساب والموقع والمحتوى المنشور.",
    url: "/privacy",
    type: "website"
  }
};

export default function PrivacyPage() {
  const content = getContent("legal/privacy");

  return (
    <>
      <MarketingNav />
      <main className="bg-background pt-24">
        <section className="container-page max-w-4xl pb-14 pt-8 md:pb-20 md:pt-14">
          <div className="rounded-[var(--radius-panel)] border border-border bg-card p-5 shadow-soft md:p-8">
            <div className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                  <ShieldCheck className="size-3.5" aria-hidden />
                  صفحة قانونية
                </p>
                <h1 className="mt-4 text-3xl font-semibold text-foreground md:text-5xl">
                  {content.title}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
                  آخر تحديث: {content.lastUpdated}
                </p>
              </div>
              <div className="flex gap-2 text-xs font-semibold">
                <Link href="/terms" className="rounded-full border border-border px-3 py-2 hover:bg-muted">
                  شروط الاستخدام
                </Link>
                <Link href="/cookies" className="rounded-full border border-border px-3 py-2 hover:bg-muted">
                  ملفات الارتباط
                </Link>
              </div>
            </div>
            <div className="divide-y divide-border">
              {content.sections.map((section: { title: string; body: string }, index: number) => (
                <section key={section.title} className="grid gap-3 py-6 md:grid-cols-[3rem_1fr] md:gap-5">
                  <span className="grid size-9 place-items-center rounded-2xl bg-ink text-xs font-semibold text-white">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground md:text-2xl">
                      {section.title}
                    </h2>
                    <p className="mt-3 text-sm leading-8 text-muted-foreground md:text-base">
                      {section.body}
                    </p>
                  </div>
                </section>
              ))}
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </>
  );
}
