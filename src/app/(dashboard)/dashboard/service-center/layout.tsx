import type { ReactNode } from "react";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { isServicesPlatformUiVisible } from "@/modules/services-platform/ui-visibility";

export default async function ServiceCenterLayout({ children }: { children: ReactNode }) {
  if (!(await isServicesPlatformUiVisible(prisma))) notFound();
  return children;
}
