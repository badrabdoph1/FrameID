import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { ArrowLeft, CheckCircle2, Images, LayoutDashboard, Sparkles } from "lucide-react";

import { MarketingNav } from "@/components/layout/marketing-nav";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { platformStats } from "@/modules/marketing/platform-content";

const siteUrl = "https://frameid.app";
const heroImage =
  "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1800&q=85";

export const metadata: Metadata = {
  title: "موقع مصور جاهز خلال دقائق",
  description:
    "FrameID يمنح المصور موقعًا احترافيًا، رابطًا خاصًا، قالبًا حيًا، وتجربة مجانية قبل الدفع.",
  alternates: {
    canonical: siteUrl
  },
  openGraph: {
    title: "FrameID | موقع مصور جاهز خلال دقائق",
    description:
      "موقع احترافي للمصورين: قالب حي، رابط خاص، وتجربة مجانية قبل الدفع.",
    url: siteUrl,
    siteName: "FrameID",
    locale: "ar_EG",
    type: "website",
    images: [
      {
        url: heroImage,
        width: 1200,
        height: 630,
        alt: "FrameID منصة مواقع للمصورين"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "FrameID | موقع مصور جاهز خلال دقائق",
    description: "قالب حي ورابط خاص وتجربة مجانية قبل الدفع.",
    images: [heroImage]
  }
};

const trustSignals = ["لا يوجد دفع قبل التجربة", "قالب حي", "رابط خاص"];

const productPillars = [
  {
    icon: LayoutDashboard,
    title: "لوحة تحكم هادئة",
    body: "عدّل رابطك، صورك، باقاتك، وبيانات التواصل بدون محرر معقد."
  },
  {
    icon: Images,
    title: "موقع يليق بالصور",
    body: "واجهة بسيطة تجعل أعمالك هي البطل وتعمل بسلاسة من الهاتف."
  },
  {
    icon: Sparkles,
    title: "فخامة محفوظة",
    body: "قوالب بقيود ذكية تحافظ على الشكل النظيف مهما أضفت من محتوى."
  }
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "FrameID",
      url: siteUrl
    },
    {
      "@type": "WebSite",
      name: "FrameID",
      url: siteUrl,
      inLanguage: "ar"
    },
    {
      "@type": "SoftwareApplication",
      name: "FrameID",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: siteUrl,
      description:
        "منصة عربية تمنح المصورين مواقع احترافية بقوالب حية وروابط خاصة.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "EGP",
        description: "تجربة مجانية قبل الدفع"
      }
    }
  ]
};

export default function HomePage() {
  return (
    <>
      <MarketingNav />
      <main id="main-content">
        <section className="relative min-h-[94svh] overflow-hidden bg-ink text-white">
          <Image
            src={heroImage}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-55"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,7,7,.42),rgba(7,7,7,.88)_72%,#070707_100%)]" />
          <div className="container-page relative flex min-h-[94svh] flex-col justify-end pb-10 pt-28 md:pb-16">
            <div className="max-w-3xl">
              <Badge tone="luxury" className="mb-5 border-white/20 bg-white/10 text-white">
                منصة مواقع للمصورين
              </Badge>
              <h1 className="text-balance text-5xl font-semibold leading-[1.05] md:text-7xl">
                موقع مصور احترافي خلال دقائق.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-white/78 md:text-lg">
                FrameID يبني للمصور حضورًا فخمًا وسريعًا: قالب حي، رابط خاص،
                لوحة تحكم بسيطة، وتجربة مجانية قبل الدفع.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/templates"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-white px-6 text-sm font-semibold text-ink transition-[background-color] hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  شاهد القوالب
                  <ArrowLeft className="size-4" aria-hidden />
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-control)] border border-white/20 px-6 text-sm font-semibold text-white transition-[background-color,border-color] hover:border-white/45 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  ابدأ التجربة المجانية
                </Link>
              </div>
              <div className="mt-6 flex flex-wrap gap-3 text-sm text-white/72">
                {trustSignals.map((signal) => (
                  <span key={signal} className="inline-flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-champagne" aria-hidden />
                    {signal}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {platformStats.map((stat) => (
                <div
                  key={stat.label}
                  className="border-t border-white/18 pt-4 text-white"
                >
                  <div className="text-3xl font-semibold">{stat.value}</div>
                  <div className="mt-1 text-sm text-white/60">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="container-page py-14 md:py-24">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-champagne-strong">
              كل شيء قليل، لكن مضبوط
            </p>
            <h2 className="mt-3 text-3xl font-semibold md:text-5xl">
              موقع جاهز للعميل، ولوحة سهلة للمصور.
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
      <script
        id="frameid-home-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
