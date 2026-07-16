"use client"

import { AdminErrorExperience } from "@/components/errors/admin-error-experience"

export default function AdminError({
  error,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <AdminErrorExperience error={error} homeHref="/admin" />
}
