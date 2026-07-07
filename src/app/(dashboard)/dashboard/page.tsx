import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getPlatformBaseUrl } from "@/lib/platform-url";
import { getCurrentRequestSession } from "@/modules/auth/request-session";
import { createDashboardViewModel } from "@/modules/dashboard/dashboard-view-model";
import { DashboardContent } from "./dashboard-content";

export const metadata: Metadata = {
  title: "لوحة التحكم | FrameID"
};

export const dynamic = "force-dynamic";

type DashboardPageProps = {
  searchParams: Promise<{
    slugChanged?: string;
    slugError?: string;
  }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const { slugChanged, slugError } = await searchParams;
  const session = await getCurrentRequestSession();

  if (!session) {
    redirect("/login");
  }

  const dashboard = createDashboardViewModel({
    session,
    platformBaseUrl: getPlatformBaseUrl(),
    now: new Date()
  });

  return (
    <DashboardContent {...dashboard} slugChanged={slugChanged} slugError={slugError} />
  );
}
