"use client";

import { PlatformErrorExperience } from "@/components/errors/platform-error-experience";

export default function ErrorPage({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <PlatformErrorExperience error={error} />;
}
