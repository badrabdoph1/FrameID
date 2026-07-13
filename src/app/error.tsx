"use client";

import { ErrorExperience } from "@/components/errors/error-experience";

export default function ErrorPage({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorExperience variant="generic" error={error} />;
}
