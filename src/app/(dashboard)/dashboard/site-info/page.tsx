import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCurrentRequestSession } from "@/modules/auth/request-session";
import { SiteInfoClient } from "@/app/(dashboard)/dashboard/site-info/site-info-client";

export const metadata: Metadata = {
  title: "معلومات الموقع | FrameID",
};

export const dynamic = "force-dynamic";

export default async function SiteInfoPage() {
  const session = await getCurrentRequestSession();

  if (!session) {
    redirect("/login");
  }

  const [user, profile] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, phone: true },
    }),
    prisma.contactProfile.findUnique({
      where: { siteId: session.site.id },
      include: {
        avatarAsset: { select: { url: true } },
        coverAsset: { select: { url: true } },
      },
    }),
  ]);

  return (
    <SiteInfoClient
      userName={user?.name ?? ""}
      userEmail={user?.email ?? ""}
      userPhone={user?.phone ?? null}
      studioName={profile?.studioName ?? null}
      bio={profile?.bio ?? null}
      longDescription={profile?.longDescription ?? null}
      phone={profile?.phone ?? null}
      whatsapp={profile?.whatsapp ?? null}
      email={profile?.email ?? null}
      city={profile?.city ?? null}
      country={profile?.country ?? null}
      address={profile?.address ?? null}
      googleMapsUrl={profile?.googleMapsUrl ?? null}
      workingHours={profile?.workingHours as Record<string, string> | null}
      bookingMessageTemplate={profile?.bookingMessageTemplate ?? null}
      instagram={profile?.instagram ?? null}
      facebook={profile?.facebook ?? null}
      tiktok={profile?.tiktok ?? null}
      snapchat={profile?.snapchat ?? null}
      youtube={profile?.youtube ?? null}
      behance={profile?.behance ?? null}
      fiveHundredPx={profile?.fiveHundredPx ?? null}
      linkedin={profile?.linkedin ?? null}
      telegram={profile?.telegram ?? null}
      xTwitter={profile?.xTwitter ?? null}
      threads={profile?.threads ?? null}
      website={profile?.website ?? null}
      avatarUrl={profile?.avatarAsset?.url ?? null}
      coverUrl={profile?.coverAsset?.url ?? null}
    />
  );
}
