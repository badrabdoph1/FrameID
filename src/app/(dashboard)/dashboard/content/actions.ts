"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { processError } from "@/lib/errors";
import { getCurrentRequestSession } from "@/modules/auth/request-session";
import { createPrismaSiteContentRepository } from "@/modules/content/prisma-site-content-repository";
import { createSiteContentService } from "@/modules/content/site-content-service";
import { isTemplateSectionType } from "@/modules/themes/template-contract";
import { uploadSiteImageAction } from "@/app/(dashboard)/dashboard/site-info/actions";

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

function readNumber(formData: FormData, key: string, fallback: number): number {
  const value = Number(readFormString(formData, key));
  return Number.isInteger(value) && value >= 0 ? value : fallback;
}

export async function updateSectionAction(
  formData: FormData,
): Promise<AutosaveState> {
  const session = await getCurrentRequestSession();
  if (!session) redirect("/login");

  const type = readFormString(formData, "type");
  if (!isTemplateSectionType(type)) {
    return { ok: false, message: "نوع القسم غير صالح" };
  }

  const settings: Record<string, unknown> = {
    eyebrow: readFormString(formData, "eyebrow"),
  };
  if (formData.has("layout")) settings.layout = readFormString(formData, "layout");
  if (formData.has("limit")) settings.limit = readNumber(formData, "limit", 6);

  const data: Record<string, unknown> = {
    description: readFormString(formData, "description"),
    settings,
  };
  if (type === "hero") {
    Object.assign(data, {
      headline: readFormString(formData, "headline"),
      subheadline: readFormString(formData, "subheadline"),
      imageUrl: readFormString(formData, "imageUrl"),
      overlay: readFormString(formData, "overlay"),
      position: readFormString(formData, "position"),
      height: readFormString(formData, "height"),
      cta: {
        label: readFormString(formData, "ctaLabel"),
        target: readFormString(formData, "ctaTarget"),
      },
    });
  }
  if (type === "contact") {
    data.callToAction = readFormString(formData, "callToAction");
  }

  try {
    await getContentService().updateSection({
      session,
      type,
      title: readFormString(formData, "title"),
      sortOrder: readNumber(formData, "sortOrder", 0),
      isVisible: formData.get("isVisible") === "on",
      data,
    });
    revalidatePath("/dashboard/content");
    revalidatePath(`/p/${session.site.slug}`);
    return { ok: true, message: "تم حفظ القسم" };
  } catch (error) {
    const { userError } = await processError(error, {
      userId: session.user.id,
      tenantId: session.tenant.id,
      metadata: { action: "updateSection", sectionType: type },
    });
    return { ok: false, message: userError.message };
  }
}

export async function uploadHeroImageAction(formData: FormData) {
  formData.set("field", "coverAssetId");
  return uploadSiteImageAction(formData);
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
