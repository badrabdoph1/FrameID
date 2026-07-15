import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentRequestSession } from "@/modules/auth/request-session";
import { prisma } from "@/lib/prisma";
import { getPlatformBaseUrl } from "@/lib/platform-url";
import { PublishClient } from "@/app/(dashboard)/dashboard/publish/publish-client";

export const metadata: Metadata = {
  title: "النشر والمميزات | FrameID"
};

export const dynamic = "force-dynamic";

type PublishPageProps = {
  searchParams: Promise<{
    updated?: string;
    error?: string;
  }>;
};

export default async function DashboardPublishPage({
  searchParams
}: PublishPageProps) {
  const session = await getCurrentRequestSession();
  const { updated, error } = await searchParams;

  if (!session) {
    redirect("/login");
  }

  const [packagesCount, imagesCount, contactProfile] = await Promise.all([
    prisma.package.count({ where: { siteId: session.site.id, deletedAt: null } }),
    prisma.galleryImage.count({
      where: {
        deletedAt: null,
        album: { siteId: session.site.id, deletedAt: null },
        asset: { deletedAt: null },
      },
    }),
    prisma.contactProfile.findUnique({
      where: { siteId: session.site.id },
      select: { phone: true, whatsapp: true, email: true },
    }),
  ]);

  const site = await prisma.site.findUnique({
    where: { id: session.site.id },
    select: { status: true, isPublished: true, publishedVersion: true },
  });

  const hasContact = Boolean(contactProfile?.phone || contactProfile?.whatsapp || contactProfile?.email);
  const hasPortfolio = imagesCount > 0;
  const hasPackages = packagesCount > 0;
  const canPublish = hasContact && hasPortfolio && hasPackages;

  const features = [
    { id: "contact", label: "المعلومات الشخصية", enabled: hasContact, href: "/dashboard/site-info" },
    { id: "packages", label: "الأسعار والباقات", enabled: hasPackages, href: "/dashboard/services" },
    { id: "social", label: "وسائل التواصل", enabled: Boolean(contactProfile?.whatsapp || contactProfile?.phone), href: "/dashboard/site-info" },
    { id: "gallery", label: "معرض الصور", enabled: false, comingSoon: true, href: "/dashboard/gallery" },
    { id: "invitations", label: "الدعسات الإلكترونية", enabled: false, comingSoon: true, href: "#" },
    { id: "reviews", label: "تقييمات العملاء", enabled: false, comingSoon: true, href: "#" },
    { id: "booking", label: "الحجز الإلكتروني", enabled: false, comingSoon: true, href: "#" },
    { id: "blog", label: "المدونة", enabled: false, comingSoon: true, href: "#" },
    { id: "store", label: "المتجر", enabled: false, comingSoon: true, href: "#" },
    { id: "faq", label: "الأسئلة الشائعة", enabled: false, comingSoon: true, href: "#" },
  ];

  const doneCount = features.filter((f) => f.enabled).length;

  return (
    <PublishClient
      siteTitle={session.site.title}
      siteUrl={`${getPlatformBaseUrl()}/p/${session.site.slug}`}
      updated={updated}
      error={error}
      isPublished={site?.status === "PUBLISHED" || site?.isPublished === true}
      publishedVersion={site?.publishedVersion ?? 0}
      features={features}
      canPublish={canPublish}
      doneCount={doneCount}
      totalCount={features.length}
    />
  );
}
