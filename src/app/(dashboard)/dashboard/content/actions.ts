"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { processError } from "@/lib/errors";
import { getCurrentRequestSession } from "@/modules/auth/request-session";
import { createPrismaSiteContentRepository } from "@/modules/content/prisma-site-content-repository";
import { createSiteContentService } from "@/modules/content/site-content-service";

export type AutosaveState = { ok: boolean; message: string };

function getContentService() {
  return createSiteContentService({
    repository: createPrismaSiteContentRepository(prisma),
  });
}

function readFormString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function updateHeroAction(
  formData: FormData,
): Promise<AutosaveState> {
  const session = await getCurrentRequestSession();

  if (!session) {
    redirect("/login");
  }

  try {
    await getContentService().updateHero({
      session,
      headline: readFormString(formData, "headline"),
      subheadline: readFormString(formData, "subheadline"),
      imageUrl: readFormString(formData, "imageUrl"),
    });
    revalidatePath("/dashboard");
    revalidatePath(`/p/${session.site.slug}`);

    return { ok: true, message: "تم الحفظ تلقائيًا" };
  } catch (error) {
    const { userError } = await processError(error, {
      userId: session.user.id,
      tenantId: session.tenant.id,
      metadata: { action: "updateHero" },
    });
    return { ok: false, message: userError.message };
  }
}

export async function updateContactAction(
  formData: FormData,
): Promise<AutosaveState> {
  const session = await getCurrentRequestSession();

  if (!session) {
    redirect("/login");
  }

  try {
    await getContentService().updateContact({
      session,
      callToAction: readFormString(formData, "callToAction"),
    });
    revalidatePath(`/p/${session.site.slug}`);

    return { ok: true, message: "تم الحفظ تلقائيًا" };
  } catch (error) {
    const { userError } = await processError(error, {
      userId: session.user.id,
      tenantId: session.tenant.id,
      metadata: { action: "updateContact" },
    });
    return { ok: false, message: userError.message };
  }
}
