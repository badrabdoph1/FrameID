"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
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
    const reason =
      error instanceof Error && error.message.includes(":")
        ? error.message.split(":").at(-1)?.trim()
        : "unavailable";

    redirect(`/dashboard?slugError=${encodeURIComponent(reason ?? "unavailable")}`);
  }

  revalidatePath("/dashboard");
  redirect("/dashboard?slugChanged=1");
}
