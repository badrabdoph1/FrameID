"use client";

import { MarketingErrorExperience } from "@/components/errors/marketing-error-experience";

export default function MarketingError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <MarketingErrorExperience error={error} />;
}
