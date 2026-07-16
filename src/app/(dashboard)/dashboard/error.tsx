"use client"

import { DashboardErrorExperience } from "@/components/errors/dashboard-error-experience"

export default function DashboardError({
  error,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <DashboardErrorExperience error={error} homeHref="/dashboard" />
}
