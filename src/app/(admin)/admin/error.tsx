"use client"

import { ErrorExperience } from "@/components/errors/error-experience"

export default function AdminError({
  error,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <ErrorExperience variant="admin" error={error} homeHref="/admin" />
}
