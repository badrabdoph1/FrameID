"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { processError } from "@/lib/errors";
import { getCurrentRequestSession } from "@/modules/auth/request-session";
import { createPrismaSiteThemeSelectionRepository } from "@/modules/themes/prisma-site-theme-selection-repository";
import { createSiteThemeSelectionService } from "@/modules/themes/site-theme-selection-service";

export async function selectTemplateAction(formData: FormData) {
  const session = await getCurrentRequestSession();

  if (!session) {
    redirect("/login");
  }

  const templateCode = readString(formData, "templateCode");

  if (!templateCode) {
    redirect("/dashboard/design?error=لم يتم اختيار قالب");
  }

  try {
    await createSiteThemeSelectionService({
      repository: createPrismaSiteThemeSelectionRepository(prisma),
    }).selectTemplate({
      session,
      templateCode,
    });
  } catch (error) {
    const { userError } = await processError(error, {
      userId: session.user.id,
      tenantId: session.tenant.id,
      metadata: { action: "selectTemplate", templateCode },
    });
    redirect(`/dashboard/design?error=${encodeURIComponent(userError.message)}`);
  }

  revalidatePath("/dashboard/design");
  revalidatePath(`/p/${session.site.slug}`);
  redirect("/dashboard/design?selected=1");
}

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}
