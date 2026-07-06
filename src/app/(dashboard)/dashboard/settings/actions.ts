"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCurrentRequestSession } from "@/modules/auth/request-session";

export async function updateSeoSettingsAction(formData: FormData) {
  const session = await getCurrentRequestSession();

  if (!session) {
    redirect("/login");
  }

  const title = readString(formData, "seoTitle");
  const description = readString(formData, "description");
  const canonicalUrl = readString(formData, "canonicalUrl");
  const robotsIndex = formData.get("robotsIndex") === "on";

  if (!title) {
    redirect("/dashboard/settings?error=seo-title");
  }

  await prisma.sEOSettings.upsert({
    where: {
      siteId: session.site.id
    },
    update: {
      title,
      description: description || null,
      canonicalUrl: canonicalUrl || null,
      robotsIndex
    },
    create: {
      siteId: session.site.id,
      title,
      description: description || null,
      canonicalUrl: canonicalUrl || null,
      robotsIndex
    }
  });

  revalidatePath("/dashboard/settings");
  revalidatePath(`/p/${session.site.slug}`);
  redirect("/dashboard/settings?updated=seo");
}

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}
