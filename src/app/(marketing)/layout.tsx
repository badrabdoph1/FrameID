import type { ReactNode } from "react";

import { PublicLivingJourney } from "@/components/public-journey/public-living-journey";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <PublicLivingJourney />
    </>
  );
}
