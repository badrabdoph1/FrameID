import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Images, LayoutDashboard, Sparkles } from "lucide-react";

import { MarketingNav } from "@/components/layout/marketing-nav";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { platformStats } from "@/modules/marketing/platform-content";

const productPillars = [
  {
    icon: LayoutDashboard,
    title: "لوحة تحكم هادئة",
    body: "رابط الموقع، المحتوى، الصور، الباقات، والاشتراك في تجربة واحدة قليلة الضغطات."
  },
  {
    icon: Images,
    title: "مواقع حقيقية لا صور ثابتة",
    body: "كل قالب يعمل كWebsite حي ببيانات قابلة للإدارة، وليس Screenshot للعرض فقط."
  },
  {
    icon: Sparkles,
    title: "فخامة محمية بالنظام",
    body: "Design System وTheme Engine يمنعان الفوضى ويحافظان على جودة النتيجة."
  }
];

export default function HomePage() {
  return (
    <>
      <MarketingNav />
      <main>
        <section className="relative min-h-[92svh] overflow-hidden bg-ink text-white">
          <Image
            src="https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1800&q=85"
            alt="مصور يجهز كاميرا داخل استوديو هادئ"
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,7,7,.52),rgba(7,7,7,.88))]" />
          <div className="container-page relative flex min-h-[92svh] flex-col justify-end pb-16 pt-28">
            <div className="max-w-3xl">
              <Badge tone="luxury" className="mb-5">
                منصة مواقع للمصورين
              </Badge>
              <h1 className="text-balance text-5xl font-semibold leading-[1.05] md:text-7xl">
                موقع مصور احترافي خلال دقائق.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/80">
                FrameID يبني للمصور هوية رقمية كاملة: رابط خاص، قالب حي،
                لوحة تحكم، تجربة مجانية، ونظام قابل للتوسع من أول يوم.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/templates"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-white px-6 text-sm font-semibold text-ink transition hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  شاهد القوالب
                  <ArrowLeft className="size-4" aria-hidden />
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-control)] border border-white/20 px-6 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  ابدأ التجربة المجانية
                </Link>
              </div>
            </div>
            <div className="mt-12 grid gap-3 sm:grid-cols-3">
              {platformStats.map((stat) => (
                <div
                  key={stat.label}
                  className="border-t border-white/20 pt-4 text-white"
                >
                  <div className="text-3xl font-semibold">{stat.value}</div>
                  <div className="mt-1 text-sm text-white/60">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="container-page py-16 md:py-24">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-champagne-strong">
              الخطة المعمارية أولًا
            </p>
            <h2 className="mt-3 text-3xl font-semibold md:text-5xl">
              منصة جاهزة للتوسع نحو CRM وBooking وClient Gallery.
            </h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {productPillars.map((pillar) => (
              <Card key={pillar.title}>
                <CardHeader>
                  <pillar.icon className="mb-4 size-5 text-champagne-strong" />
                  <CardTitle>{pillar.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-7 text-muted-foreground">
                  {pillar.body}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
