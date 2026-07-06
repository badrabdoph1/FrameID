import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, WandSparkles } from "lucide-react";
import { notFound } from "next/navigation";

import { getTemplatePreviewImage } from "@/modules/marketing/platform-content";
import { getTemplateByCode } from "@/modules/themes/theme-registry";

export const metadata: Metadata = {
  title: "معاينة القالب",
  robots: {
    index: false,
    follow: false
  }
};

type Props = {
  params: Promise<{ code: string }>;
};

export default async function TemplatePreviewPage({ params }: Props) {
  const { code } = await params;
  const template = getTemplateByCode(code);

  if (!template || template.status !== "published") {
    notFound();
  }

  return (
    <main className="min-h-screen bg-ink text-white">
      <section className="relative min-h-screen overflow-hidden">
        <Image
          src={getTemplatePreviewImage(template)}
          alt={`معاينة قالب ${template.name}`}
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,7,7,.3),rgba(7,7,7,.92))]" />
        <div className="container-page relative flex min-h-screen flex-col justify-end pb-24 pt-24">
          <p className="font-display text-sm uppercase tracking-[0.28em] text-champagne">
            Professional Photography
          </p>
          <h1 className="mt-4 max-w-3xl text-5xl font-semibold leading-none md:text-8xl">
            ALI AHMED
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-white/74">
            هذه معاينة حية لقالب {template.name} ببيانات منظمة تعكس تجربة
            الموقع الحقيقي قبل استخدام القالب.
          </p>
        </div>
      </section>

      <div className="fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-md items-center gap-2 rounded-[var(--radius-panel)] border border-white/10 bg-ink/80 p-2 shadow-soft backdrop-blur-xl">
        <Link
          href="/templates"
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[var(--radius-control)] text-sm font-semibold text-white hover:bg-white/10"
        >
          <ArrowRight className="size-4" aria-hidden />
          رجوع
        </Link>
        <Link
          href={`/signup?template=${template.code}`}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-white px-4 text-sm font-semibold text-ink"
        >
          <WandSparkles className="size-4" aria-hidden />
          استخدام هذا القالب
        </Link>
      </div>
    </main>
  );
}
