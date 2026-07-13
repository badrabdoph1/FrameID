"use client"

import { ErrorExperience } from "@/components/errors/error-experience"

export default function MarketingError({
  error,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <ErrorExperience variant="marketing" error={error} />
}
