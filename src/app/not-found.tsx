import type { Metadata } from "next";

import { ErrorExperience } from "@/components/errors/error-experience";

export const metadata: Metadata = {
  title: "الصفحة غير موجودة",
  description: "الصفحة المطلوبة غير موجودة أو لم تعد متاحة على FrameID.",
  robots: { index: false, follow: false }
};

export default function NotFound() {
  return <ErrorExperience variant="not-found" />;
}
