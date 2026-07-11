import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCurrentRequestSession } from "@/modules/auth/request-session";
import { getPublishedTemplates } from "@/modules/themes/theme-registry";

import { TemplatesClient } from "./templates-client";

export const metadata: Metadata = {
  title: "القوالب | FrameID"
};

export const dynamic = "force-dynamic";

type TemplatesPageProps = {
  searchParams: Promise<{ selected?: string; contentReset?: string; error?: string }>;
};

export default async function TemplatesPage({ searchParams }: TemplatesPageProps) {
  const session = await getCurrentRequestSession();
  const params = await searchParams;

  if (!session) {
    redirect("/login");
  }

  const templates = getPublishedTemplates();
  const currentSite = await prisma.site.findUnique({
    where: {
      id: session.site.id
    },
    select: {
      theme: {
        select: {
          code: true,
          name: true
        }
      }
    }
  });
  const currentThemeCode = currentSite?.theme.code ?? null;

  return (
    <TemplatesClient
      templates={templates}
      currentThemeName={currentSite?.theme.name ?? null}
      currentThemeCode={currentThemeCode}
      message={
        params.error
          ? { tone: "error", text: decodeURIComponent(params.error) }
          : params.contentReset
            ? { tone: "success", text: "تم استبدال محتوى الموقع بالكامل بعد حفظ Snapshot سريع للمحتوى السابق." }
            : params.selected
              ? { tone: "success", text: "تم تغيير شكل الموقع فقط بدون تعديل المحتوى." }
              : null
      }
    />
  );
}
