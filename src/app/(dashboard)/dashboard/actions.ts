"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { processError } from "@/lib/errors";
import { getCurrentRequestSession } from "@/modules/auth/request-session";
import { createPrismaSiteSlugRepository } from "@/modules/sites/prisma-site-slug-repository";
import { createSiteSlugService } from "@/modules/sites/site-slug-service";

function getSiteSlugService() {
  return createSiteSlugService({
    repository: createPrismaSiteSlugRepository(prisma)
  });
}

export async function checkSiteSlugAction(input: string) {
  const session = await getCurrentRequestSession();

  if (!session) {
    return {
      ok: false as const,
      normalizedSlug: "",
      reason: "unauthenticated" as const
    };
  }

  return getSiteSlugService().checkAvailability(input, session.site.id);
}

export async function changeSiteSlugAction(formData: FormData) {
  const session = await getCurrentRequestSession();

  if (!session) {
    redirect("/login");
  }

  const requestedSlug = formData.get("slug");

  if (typeof requestedSlug !== "string") {
    redirect("/dashboard?slugError=invalid");
  }

  try {
    await getSiteSlugService().changeSlug({
      session,
      requestedSlug
    });
  } catch (error) {
    const { userError } = await processError(error, {
      userId: session.user.id,
      tenantId: session.tenant.id,
      metadata: { action: "changeSiteSlug" },
    });
    redirect(`/dashboard?slugError=${encodeURIComponent(userError.message)}`);
  }

  revalidatePath("/dashboard");
  redirect("/dashboard?slugChanged=1");
}
