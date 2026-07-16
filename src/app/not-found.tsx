import type { Metadata } from "next";

import { NotFoundErrorExperience } from "@/components/errors/not-found-error-experience";

export const metadata: Metadata = {
  title: "الصفحة غير موجودة",
  description: "الصفحة المطلوبة غير موجودة أو لم تعد متاحة على FrameID.",
  robots: { index: false, follow: false }
};

export default function NotFound() {
  return <NotFoundErrorExperience />;
}
