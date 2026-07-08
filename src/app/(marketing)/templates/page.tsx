import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { Eye, WandSparkles } from "lucide-react";

import { MarketingFooter } from "@/components/layout/marketing-footer";
import { MarketingNav } from "@/components/layout/marketing-nav";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTemplatePreviewImage } from "@/modules/marketing/platform-content";
import { getPublishedTemplates } from "@/modules/themes/theme-registry";

export const metadata: Metadata = {
  title: "معرض القوالب",
  description: "تصفح قوالب مواقع المصورين الاحترافية. اختار قالب وجربه قبل ما تسجل."
};

export default function TemplatesPage() {
  const templates = getPublishedTemplates();

  return (
    <>
      <MarketingNav />
      <main className="min-h-screen bg-background pt-28">
        <section className="container-page pb-16">
          <Badge tone="luxury">معرض القوالب</Badge>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold md:text-6xl">
            اختار قالب—كأنه موقع عميل حقيقي.
          </h1>
          <p className="mt-5 max-w-2xl leading-8 text-muted-foreground">
            المعاينة الحية بتفتح نفس القالب اللي هياخده المصور، وزير استخدم القالب بياخد اختيارك للتسجيل.
          </p>
          <div className="mt-8 grid gap-3 md:grid-cols-3">
            {[
              ["معاينة", "افتح القالب كموقع حقيقي قبل ما تختار."],
              ["استخدام", "القالب اللي اخترته بينتقل لصفحة إنشاء الحساب."],
              ["إنشاء تلقائي", "المصور بياخد الحساب والموقع والرابط والتجربة."]
            ].map(([title, body]) => (
              <div
                key={title}
                className="rounded-[var(--radius-card)] border border-border bg-card p-4"
              >
                <h2 className="font-semibold">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {body}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {templates.map((template) => (
              <Card key={template.code} className="overflow-hidden bg-surface">
                <div className="relative aspect-[4/3]">
                  <Image
                    src={getTemplatePreviewImage(template)}
                    alt={`معاينة قالب ${template.name}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle>{template.name}</CardTitle>
                    <Badge>{template.code}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-7 text-muted-foreground">
                    {template.description}
                  </p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <Link
                      href={`/templates/${template.code}/preview`}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] border border-border bg-surface px-4 text-sm font-semibold transition hover:bg-muted"
                    >
                      <Eye className="size-4" aria-hidden />
                      معاينة القالب
                    </Link>
                    <Link
                      href={`/signup?template=${template.code}`}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-foreground px-4 text-sm font-semibold text-background transition hover:bg-foreground/90"
                    >
                      <WandSparkles className="size-4" aria-hidden />
                      استخدم القالب ده
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
        <MarketingFooter />
      </main>
    </>
  );
}
