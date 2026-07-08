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

export default async function TemplatesPage() {
  const session = await getCurrentRequestSession();

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
    />
  );
}
