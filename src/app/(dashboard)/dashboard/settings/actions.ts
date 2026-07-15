"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { processError } from "@/lib/errors";
import { getCurrentRequestSession } from "@/modules/auth/request-session";

export async function requestAccountDeletionAction() {
  const session = await getCurrentRequestSession();

  if (!session) {
    redirect("/login");
  }

  try {
    const existingRequest = await prisma.customerRequest.findFirst({
      where: {
        tenantId: session.tenant.id,
        type: "ACCOUNT_DELETION",
        status: { in: ["PENDING", "IN_REVIEW"] },
      },
    });

    if (existingRequest) {
      redirect("/dashboard/settings?request=pending");
    }

    await prisma.customerRequest.create({
      data: {
        tenantId: session.tenant.id,
        siteId: session.site.id,
        type: "ACCOUNT_DELETION",
        title: "طلب حذف الحساب",
        description: `طلب حذف الحساب من ${session.user.name} (${session.user.email})`,
      },
    });
  } catch (error) {
    const { userError } = await processError(error, {
      userId: session.user.id,
      tenantId: session.tenant.id,
      metadata: { action: "requestAccountDeletion" },
    });
    redirect(`/dashboard/settings?error=${encodeURIComponent(userError.message)}`);
  }

  redirect("/dashboard/settings?request=deletion-submitted");
}

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

  try {
    await prisma.sEOSettings.upsert({
      where: { siteId: session.site.id },
      update: {
        title,
        description: description || null,
        canonicalUrl: canonicalUrl || null,
        robotsIndex,
      },
      create: {
        siteId: session.site.id,
        title,
        description: description || null,
        canonicalUrl: canonicalUrl || null,
        robotsIndex,
      },
    });
  } catch (error) {
    const { userError } = await processError(error, {
      userId: session.user.id,
      tenantId: session.tenant.id,
      metadata: { action: "updateSeoSettings" },
    });
    redirect(`/dashboard/settings?error=${encodeURIComponent(userError.message)}`);
  }

  revalidatePath("/dashboard/settings");
  revalidatePath(`/p/${session.site.slug}`);
  redirect("/dashboard/settings?updated=seo");
}

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}
