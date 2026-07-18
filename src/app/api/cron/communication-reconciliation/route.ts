import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { runCommunicationReconciliation } from "@/modules/communication-center/reconciliation";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

function authorized(request: Request): boolean {
  const expected = process.env.CRON_SECRET?.trim();
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return expected ? supplied === expected : process.env.NODE_ENV !== "production";
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const report = await runCommunicationReconciliation(prisma);
  return NextResponse.json(report, { status: report.status === "DEGRADED" ? 503 : 200 });
}
