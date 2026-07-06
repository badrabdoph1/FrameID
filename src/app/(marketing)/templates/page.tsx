import Image from "next/image";
import Link from "next/link";
import { Eye, WandSparkles } from "lucide-react";

import { MarketingNav } from "@/components/layout/marketing-nav";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTemplatePreviewImage } from "@/modules/marketing/platform-content";
import { getPublishedTemplates } from "@/modules/themes/theme-registry";

export default function TemplatesPage() {
  const templates = getPublishedTemplates();

  return (
    <>
      <MarketingNav />
      <main className="min-h-screen bg-background pt-28">
        <section className="container-page pb-16">
          <Badge tone="luxury">معرض القوالب</Badge>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold md:text-6xl">
            قوالب حية، قابلة للاستخدام مباشرة.
          </h1>
          <p className="mt-5 max-w-2xl leading-8 text-muted-foreground">
            المعاينة تفتح موقعًا حقيقيًا ببيانات تجريبية، ثم يمكن استخدام
            القالب لإنشاء موقع المصور تلقائيًا.
          </p>
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
                      معاينة
                    </Link>
                    <Link
                      href={`/signup?template=${template.code}`}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-foreground px-4 text-sm font-semibold text-background transition hover:bg-foreground/90"
                    >
                      <WandSparkles className="size-4" aria-hidden />
                      استخدام القالب
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
