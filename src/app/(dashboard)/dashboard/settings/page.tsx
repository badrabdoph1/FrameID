import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentRequestSession } from "@/modules/auth/request-session";
import { getPlatformBaseUrl } from "@/lib/platform-url";
import { SettingsClient } from "@/app/(dashboard)/dashboard/settings/settings-client";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "الإعدادات | FrameID"
};

export const dynamic = "force-dynamic";

export default async function DashboardSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await getCurrentRequestSession();

  if (!session) {
    redirect("/login");
  }

  const params = await searchParams;

  const pendingDeletionRequest = await prisma.customerRequest.findFirst({
    where: {
      tenantId: session.tenant.id,
      type: "ACCOUNT_DELETION",
      status: { in: ["PENDING", "IN_REVIEW"] },
    },
    select: { id: true, status: true, createdAt: true },
  });

  let requestMessage: string | undefined;
  if (typeof params.request === "string") {
    requestMessage = params.request;
  } else if (typeof params.updated === "string" && params.updated === "title") {
    requestMessage = "title-updated";
  }

  return (
    <SettingsClient
      userName={session.user.name}
      userEmail={session.user.email}
      userPhone={session.user.phone}
      userRole={session.user.role}
      siteTitle={session.site.title}
      siteSlug={session.site.slug}
      siteStatus={session.site.status}
      siteUrl={`${getPlatformBaseUrl()}/p/${session.site.slug}`}
      slugChangeUsed={session.site.slugChangeUsed}
      templateChangeUsed={session.site.templateChangeUsed}
      hasDeletionRequest={Boolean(pendingDeletionRequest)}
      requestMessage={requestMessage}
      errorMessage={typeof params.error === "string" ? params.error : undefined}
    />
  );
}
