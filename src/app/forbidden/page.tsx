import type { Metadata } from "next";

import { ForbiddenErrorExperience } from "@/components/errors/forbidden-error-experience";

export const metadata: Metadata = {
  title: "الوصول غير متاح",
  robots: { index: false, follow: false },
};

export default function ForbiddenPage() {
  return <ForbiddenErrorExperience />;
}
