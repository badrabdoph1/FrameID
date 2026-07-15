"use client";

import { usePathname } from "next/navigation";
import { getMessageForPath } from "@/lib/living-guide/messages";
import { GuideProvider } from "@/components/ui/living-guide/guide-provider";

export function LivingGuideRouter() {
  const pathname = usePathname();

  if (isDashboardRoute(pathname)) return null;

  const message = getMessageForPath(pathname);
  return <GuideProvider message={message} />;
}

function isDashboardRoute(pathname: string): boolean {
  return pathname.startsWith("/dashboard") || pathname.startsWith("/admin");
}
