import type { ReactNode } from "react";

import { ClientShell } from "@/components/layout/client-shell";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <ClientShell>{children}</ClientShell>;
}
