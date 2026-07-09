import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentRequestSession } from "@/modules/auth/request-session";
import { getPlatformBaseUrl } from "@/lib/platform-url";
import { SettingsClient } from "@/app/(dashboard)/dashboard/settings/settings-client";

export const metadata: Metadata = {
  title: "الإعدادات | FrameID"
};

export const dynamic = "force-dynamic";

export default async function DashboardSettingsPage() {
  const session = await getCurrentRequestSession();

  if (!session) {
    redirect("/login");
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
    />
  );
}
