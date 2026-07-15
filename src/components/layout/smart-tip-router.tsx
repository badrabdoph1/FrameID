"use client";

import { usePathname } from "next/navigation";
import { SmartTip } from "@/components/ui/smart-tip";
import { getTipForPath } from "@/lib/smart-tips";

export function SmartTipRouter() {
  const pathname = usePathname();

  // Only show Smart Tips on dashboard routes
  if (!pathname.startsWith("/dashboard")) {
    return null;
  }

  const tip = getTipForPath(pathname);
  return <SmartTip config={tip} />;
}
