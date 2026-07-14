import type { ReactNode } from "react";

import { SmartTipRouter } from "@/components/layout/smart-tip-router";

export default function DashboardRouteGroupLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <SmartTipRouter />
    </>
  );
}
