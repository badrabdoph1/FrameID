import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, WandSparkles } from "lucide-react";
import { notFound } from "next/navigation";

import { getThemeSiteComponent } from "@/components/themes/theme-components";
import { TemplatePreviewGuard } from "@/components/themes/template-preview-guard";
import { prisma } from "@/lib/prisma";
import { buildTemplatePreviewViewModel, getTemplateContentSource } from "@/modules/templates/template-content-source";
import { loadTemplateContentSourceOptions } from "@/modules/templates/template-starter-defaults-repository";
import { getTemplateByCode } from "@/modules/themes/theme-registry";

export const metadata: Metadata = {
  title: "معاينة القالب",
  robots: { index: false, follow: false }
};

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ code: string }>;
  searchParams?: Promise<{ embed?: string }>;
};

export default async function TemplatePreviewPage({ params, searchParams }: Props) {
  const { code } = await params;
  const query = await searchParams;
  const template = getTemplateByCode(code);

  if (!template || template.status !== "published") notFound();

  const editableTemplate = await prisma.template.findUnique({
    where: { code },
    select: { status: true, deletedAt: true }
  });

  if (editableTemplate?.deletedAt || (editableTemplate && editableTemplate.status !== "PUBLISHED")) {
    notFound();
  }

  const sourceOptions = await loadTemplateContentSourceOptions(code);
  const source = getTemplateContentSource(code, sourceOptions);
  if (!source) notFound();

  const ThemeComponent = getThemeSiteComponent(source.themeCode);
  const siteData = buildTemplatePreviewViewModel(source);
  const isEmbed = query?.embed === "1";

  return (
    <>
      <div data-smart-hint="preview-screen">
        <TemplatePreviewGuard />
        <ThemeComponent site={siteData} />
      </div>
      {isEmbed ? null : (
        <div data-preview-toolbar className="fixed inset-x-4 bottom-4 z-[90] mx-auto flex max-w-md items-center gap-2 rounded-[var(--radius-panel)] border border-white/10 bg-ink/90 p-2 shadow-[0_18px_70px_rgba(0,0,0,.35)] backdrop-blur-xl">
          <Link href="/templates" className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[var(--radius-control)] text-sm font-semibold text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/45">
            <ArrowRight className="size-4" aria-hidden />
            رجوع
          </Link>
          <Link href={`/signup?template=${template.code}`} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-white px-4 text-sm font-semibold text-ink hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/55">
            <WandSparkles className="size-4" aria-hidden />
            استخدام هذا القالب
          </Link>
        </div>
      )}
    </>
  );
}
