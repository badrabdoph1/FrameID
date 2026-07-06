import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Eye,
  Images,
  Link2,
  MessageCircle,
  ShieldCheck,
  Sparkles
} from "lucide-react";

import { MarketingNav } from "@/components/layout/marketing-nav";
import { Badge } from "@/components/ui/badge";
import {
  getTemplatePreviewImage,
  platformStats
} from "@/modules/marketing/platform-content";
import { getPublishedTemplates } from "@/modules/themes/theme-registry";

const siteUrl = "https://frameid.app";
const heroImage =
  "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1800&q=85";

export const metadata: Metadata = {
  title: "موقع مصور جاهز خلال دقائق",
  description:
    "منصة عربية تمنح المصور موقعًا احترافيًا، رابطًا خاصًا، قالبًا حيًا، ولوحة تحكم بسيطة مع تجربة مجانية قبل الدفع.",
  alternates: {
    canonical: siteUrl
  },
  openGraph: {
    title: "FrameID | موقع مصور جاهز خلال دقائق",
    description:
      "اختر قالبًا حيًا، أنشئ حسابك، واستلم رابط موقعك كمصور قبل أول رسالة للعميل.",
    url: siteUrl,
    siteName: "FrameID",
    locale: "ar_EG",
    type: "website",
    images: [
      {
        url: heroImage,
        width: 1200,
        height: 630,
        alt: "واجهة FrameID لمواقع المصورين"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "FrameID | موقع مصور جاهز خلال دقائق",
    description:
      "موقع احترافي للمصورين مع قوالب حية وتجربة مجانية قبل الدفع.",
    images: [heroImage]
  }
};

const trustSignals = [
  "لا يوجد دفع قبل التجربة",
  "رابط موقعك يتولد تلقائيًا",
  "تجربة عربية RTL من البداية"
];

const workflow = [
  {
    icon: Eye,
    title: "اختر قالبًا حيًا",
    body: "شاهد شكل الموقع الحقيقي قبل التسجيل، وليس صورة ثابتة أو وعدًا غامضًا."
  },
  {
    icon: Camera,
    title: "أنشئ حساب المصور",
    body: "ننشئ الحساب، الموقع، الرابط، والبيانات الأولية تلقائيًا في خطوة واحدة."
  },
  {
    icon: Link2,
    title: "أرسل رابطك للعميل",
    body: "ابدأ بتعديل الصور والباقات وطرق التواصل من لوحة تحكم بسيطة."
  }
];

const valueCards = [
  {
    icon: Images,
    title: "معرض أعمال يبيعك بصمت",
    body: "العميل يرى الصور، الباقات، وطريقة التواصل بسرعة من الهاتف."
  },
  {
    icon: ShieldCheck,
    title: "فخامة بدون فوضى إعدادات",
    body: "القوالب مصممة بقيود ذكية حتى تبقى النتيجة نظيفة مهما عدلت."
  },
  {
    icon: MessageCircle,
    title: "جاهز للواتساب والعمل اليومي",
    body: "الصفحة تقود العميل إلى القرار التالي: مشاهدة أعمالك ثم التواصل معك."
  }
];

const objections = [
  {
    question: "هل أحتاج دفع قبل التجربة؟",
    answer: "لا. تبدأ بتجربة مجانية، وبعدها تقرر تفعيل موقعك."
  },
  {
    question: "هل هو Website Builder معقد؟",
    answer: "لا. FrameID يختصر الاختيارات حتى تحصل على موقع جاهز بدل محرر متعب."
  },
  {
    question: "هل القوالب مجرد صور؟",
    answer: "لا. المعاينة تفتح قالبًا حيًا يعمل مثل موقع المصور الحقيقي."
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
        "منصة SaaS عربية تمنح المصورين مواقع احترافية وقوالب حية ولوحة تحكم بسيطة.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "EGP",
        description: "تجربة مجانية قبل الدفع"
      }
    },
    {
      "@type": "FAQPage",
      mainEntity: objections.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer
        }
      }))
    }
  ]
};

export default function HomePage() {
  const [featuredTemplate] = getPublishedTemplates();
  const previewImage = featuredTemplate
    ? getTemplatePreviewImage(featuredTemplate)
    : heroImage;

  return (
    <>
      <MarketingNav />
      <main id="main-content">
        <section className="relative isolate overflow-hidden bg-ink text-white">
          <Image
            src={heroImage}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-45"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,7,7,.44),rgba(7,7,7,.9)_58%,#070707_100%)]" />
          <div className="container-page relative grid min-h-[96svh] items-end gap-10 pb-20 pt-28 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:pb-14">
            <div className="max-w-3xl">
              <Badge tone="luxury" className="mb-5 border-white/20 bg-white/10 text-white">
                منصة مواقع للمصورين
              </Badge>
              <h1 className="text-balance text-5xl font-semibold leading-[1.04] md:text-7xl">
                موقعك كمصور جاهز للإرسال قبل أول رسالة للعميل.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/78">
                اختر قالبًا حيًا، أنشئ حسابك، واستلم رابطًا خاصًا يعرض أعمالك
                وباقاتك وطرق التواصل مع تجربة مجانية قبل الدفع.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/templates"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-white px-6 text-sm font-semibold text-ink transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white motion-reduce:transition-none"
                >
                  شاهد القوالب الحية
                  <ArrowLeft className="size-4" aria-hidden />
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-control)] border border-white/20 px-6 text-sm font-semibold text-white transition-[background-color,border-color] hover:border-white/45 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white motion-reduce:transition-none"
                >
                  ابدأ التجربة المجانية
                </Link>
              </div>
              <div className="mt-7 flex flex-col gap-3 text-sm text-white/75 sm:flex-row sm:flex-wrap">
                {trustSignals.map((signal) => (
                  <span key={signal} className="inline-flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-champagne" aria-hidden />
                    {signal}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="absolute -inset-5 rounded-[2rem] border border-white/10 bg-white/5 blur-xl" />
              <div className="relative overflow-hidden rounded-[1.5rem] border border-white/15 bg-[#080808]/88 shadow-[0_24px_90px_rgba(0,0,0,.36)]">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-xs text-white/55">
                  <span translate="no">frameid.app/p/ali</span>
                  <span>معاينة حية</span>
                </div>
                <div className="relative aspect-[4/5]">
                  <Image
                    src={previewImage}
                    alt="معاينة قالب موقع مصور داخل FrameID"
                    fill
                    sizes="(max-width: 1024px) 0px, 42vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-x-4 bottom-4 rounded-[var(--radius-panel)] border border-white/15 bg-black/55 p-4 backdrop-blur">
                    <p className="text-xs text-white/60">موقع المصور</p>
                    <p className="mt-1 text-2xl font-semibold">Ali Ahmed Studio</p>
                    <p className="mt-2 text-sm leading-6 text-white/70">
                      معرض أعمال، باقات تصوير، وتواصل سريع في صفحة واحدة.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:col-span-2">
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

        <section className="container-page py-16 md:py-24">
          <div className="grid gap-10 md:grid-cols-[.85fr_1.15fr] md:items-end">
            <div>
              <p className="text-sm font-semibold text-champagne-strong">
                من أول زيارة إلى أول رابط
              </p>
              <h2 className="mt-3 max-w-2xl text-3xl font-semibold md:text-5xl">
                رحلة قصيرة وواضحة بدل عشرات الإعدادات.
              </h2>
            </div>
            <p className="max-w-2xl text-base leading-8 text-muted-foreground">
              FrameID لا يطلب من المصور أن يصبح مصمم مواقع. المنصة تقوده إلى
              القرار الصحيح: قالب جميل، حساب سريع، رابط يمكن إرساله للعميل.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {workflow.map((step, index) => (
              <section
                key={step.title}
                className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft"
              >
                <div className="flex items-center justify-between gap-4">
                  <step.icon className="size-5 text-champagne-strong" aria-hidden />
                  <span className="font-display text-3xl text-champagne-strong/30">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mt-5 text-xl font-semibold">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {step.body}
                </p>
              </section>
            ))}
          </div>
        </section>

        <section className="bg-ink py-16 text-white md:py-24">
          <div className="container-page grid gap-10 lg:grid-cols-[.95fr_1.05fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold text-champagne">
                النتيجة التي يراها العميل
              </p>
              <h2 className="mt-3 text-3xl font-semibold md:text-5xl">
                ليس مجرد رابط. واجهة بيع صغيرة تعمل من الهاتف.
              </h2>
              <p className="mt-5 max-w-xl leading-8 text-white/68">
                الصفحة الرئيسية للمصور يجب أن تعرض الثقة بسرعة: صور قوية،
                أسعار مفهومة، وطريق تواصل واضح. هذا هو المكان الذي يتخذ فيه
                العميل قراره.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              {valueCards.map((card) => (
                <section
                  key={card.title}
                  className="rounded-[var(--radius-card)] border border-white/10 bg-white/[0.035] p-5"
                >
                  <card.icon className="size-5 text-champagne" aria-hidden />
                  <h3 className="mt-4 text-lg font-semibold">{card.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-white/65">{card.body}</p>
                </section>
              ))}
            </div>
          </div>
        </section>

        <section className="container-page py-16 md:py-24">
          <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr]">
            <div>
              <p className="text-sm font-semibold text-champagne-strong">
                قبل أن تسأل
              </p>
              <h2 className="mt-3 text-3xl font-semibold md:text-5xl">
                إجابات سريعة على مخاوف المصور.
              </h2>
            </div>
            <div className="space-y-3">
              {objections.map((item) => (
                <section
                  key={item.question}
                  className="rounded-[var(--radius-card)] border border-border bg-surface p-5"
                >
                  <h3 className="text-lg font-semibold">{item.question}</h3>
                  <p className="mt-2 leading-7 text-muted-foreground">{item.answer}</p>
                </section>
              ))}
            </div>
          </div>
        </section>

        <section className="container-page pb-20 md:pb-28">
          <div className="relative overflow-hidden rounded-[1.5rem] bg-ink px-6 py-10 text-white md:px-10">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(216,180,106,.22),transparent_42%)]" />
            <div className="relative grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <Sparkles className="mb-4 size-6 text-champagne" aria-hidden />
                <h2 className="text-3xl font-semibold md:text-5xl">
                  ابدأ من القالب. دع الموقع يظهر أولًا.
                </h2>
                <p className="mt-4 max-w-2xl leading-8 text-white/70">
                  شاهد القوالب الحية، اختر الأقرب لأسلوب تصويرك، ثم أنشئ موقعك
                  التجريبي بدون دفع مسبق.
                </p>
              </div>
              <Link
                href="/templates"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-white px-6 text-sm font-semibold text-ink transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white motion-reduce:transition-none"
              >
                شاهد القوالب الحية
                <ArrowLeft className="size-4" aria-hidden />
              </Link>
            </div>
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
