"use client"

import { ErrorExperience } from "@/components/errors/error-experience"

export default function DashboardError({
  error,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <ErrorExperience variant="dashboard" error={error} homeHref="/dashboard" />
}
