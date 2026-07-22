"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export function TrackedServiceLink({ href, className, event, children }: { href: string; className?: string; event: { name: string; idempotencyKey: string; offeringId?: string; attributionId?: string }; children: ReactNode }) {
  return <Link href={href} className={className} onClick={() => { void fetch("/api/services/events", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(event), keepalive: true }); }}>{children}</Link>;
}
