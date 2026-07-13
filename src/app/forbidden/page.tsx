import type { Metadata } from "next";

import { ErrorExperience } from "@/components/errors/error-experience";

export const metadata: Metadata = {
  title: "الوصول غير متاح",
  robots: { index: false, follow: false },
};

export default function ForbiddenPage() {
  return <ErrorExperience variant="forbidden" />;
}
