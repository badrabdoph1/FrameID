"use client";

import { usePathname } from "next/navigation";
import { SmartTip } from "@/components/ui/smart-tip";
import { getTipForPath } from "@/lib/smart-tips";

export function SmartTipRouter() {
  const pathname = usePathname();
  const tip = getTipForPath(pathname);
  return <SmartTip config={tip} />;
}
