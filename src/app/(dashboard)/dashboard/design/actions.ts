"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { processError } from "@/lib/errors";
import { getCurrentRequestSession } from "@/modules/auth/request-session";
import { createPrismaSignupProvisioningRepository } from "@/modules/onboarding/prisma-signup-repository";
import { replaceSiteContentFromTemplate } from "@/modules/templates/prisma-template-content-reset";
import { createTemplateProvisioningService } from "@/modules/templates/template-provisioning-service";
import { createPrismaSiteThemeSelectionRepository } from "@/modules/themes/prisma-site-theme-selection-repository";
import { createSiteThemeSelectionService } from "@/modules/themes/site-theme-selection-service";

export async function selectTemplateAction(formData: FormData) {
  const session = await getCurrentRequestSession();

  if (!session) {
    redirect("/login");
  }

  const templateCode = readString(formData, "templateCode");

  if (!templateCode) {
    redirect("/dashboard/templates?error=لم يتم اختيار قالب");
  }

  try {
    const currentSite = await prisma.site.findUnique({
      where: { id: session.site.id },
      select: { templateChangeUsed: true },
    });

    if (currentSite?.templateChangeUsed) {
      redirect("/dashboard/templates?error=تم استخدام فرصة تغيير القالب. تواصل مع الدعم الفني.");
    }

    await createSiteThemeSelectionService({
      repository: createPrismaSiteThemeSelectionRepository(prisma),
    }).selectTemplate({
      session,
      templateCode,
    });

    await prisma.site.update({
      where: { id: session.site.id },
      data: { templateChangeUsed: true },
    });
  } catch (error) {
    const { userError } = await processError(error, {
      userId: session.user.id,
      tenantId: session.tenant.id,
      metadata: { action: "selectTemplate", templateCode },
    });
    redirect(`/dashboard/templates?error=${encodeURIComponent(userError.message)}`);
  }

  revalidatePath("/dashboard/templates");
  revalidatePath("/dashboard/templates");
  revalidatePath(`/p/${session.site.slug}`);
  redirect("/dashboard/templates?selected=1");
}

export async function resetSiteFromTemplateAction(formData: FormData) {
  const session = await getCurrentRequestSession();

  if (!session) {
    redirect("/login");
  }

  const templateCode = readString(formData, "templateCode");
  const confirmation = readString(formData, "confirmation");

  if (!templateCode) {
    redirect("/dashboard/templates?error=لم يتم اختيار قالب");
  }

  if (confirmation !== "استبدال المحتوى") {
    redirect("/dashboard/templates?error=اكتب تأكيد الاستبدال كما هو.");
  }

  try {
    const provisioning = createTemplateProvisioningService({
      repository: createPrismaSignupProvisioningRepository(prisma),
    });
    const payload = await provisioning.buildSiteFromTemplate({
      templateCode,
      ownerName: session.user.name,
    });

    await replaceSiteContentFromTemplate(prisma, {
      siteId: session.site.id,
      tenantId: session.tenant.id,
      payload,
      reason: "customer-template-content-reset",
    });
  } catch (error) {
    const { userError } = await processError(error, {
      userId: session.user.id,
      tenantId: session.tenant.id,
      metadata: { action: "resetSiteFromTemplate", templateCode },
    });
    redirect(`/dashboard/templates?error=${encodeURIComponent(userError.message)}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/templates");
  revalidatePath("/dashboard/services");
  revalidatePath("/dashboard/site-info");
  revalidatePath("/dashboard/gallery");
  revalidatePath(`/p/${session.site.slug}`);
  redirect("/dashboard/templates?contentReset=1");
}

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}
