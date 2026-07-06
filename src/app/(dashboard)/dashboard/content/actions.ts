"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCurrentRequestSession } from "@/modules/auth/request-session";
import { createPrismaSiteContentRepository } from "@/modules/content/prisma-site-content-repository";
import { createSiteContentService } from "@/modules/content/site-content-service";

function getContentService() {
  return createSiteContentService({
    repository: createPrismaSiteContentRepository(prisma)
  });
}

export type AutosaveState = {
  ok: boolean;
  message: string;
};

export async function updateHeroAction(formData: FormData): Promise<AutosaveState> {
  const session = await getCurrentRequestSession();

  if (!session) {
    redirect("/login");
  }

  try {
    await getContentService().updateHero({
      session,
      headline: readFormString(formData, "headline"),
      subheadline: readFormString(formData, "subheadline"),
      imageUrl: readFormString(formData, "imageUrl")
    });
    revalidatePath("/dashboard");
    revalidatePath(`/p/${session.site.slug}`);

    return {
      ok: true,
      message: "تم الحفظ تلقائيًا"
    };
  } catch {
    return {
      ok: false,
      message: "تعذر الحفظ. راجع البيانات وحاول مرة أخرى."
    };
  }
}

export async function updateContactAction(
  formData: FormData
): Promise<AutosaveState> {
  const session = await getCurrentRequestSession();

  if (!session) {
    redirect("/login");
  }

  try {
    await getContentService().updateContact({
      session,
      callToAction: readFormString(formData, "callToAction")
    });
    revalidatePath(`/p/${session.site.slug}`);

    return {
      ok: true,
      message: "تم الحفظ تلقائيًا"
    };
  } catch {
    return {
      ok: false,
      message: "تعذر الحفظ. راجع البيانات وحاول مرة أخرى."
    };
  }
}

function readFormString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
