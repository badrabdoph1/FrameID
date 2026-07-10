import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { syncCustomerLifecycle } from "@/modules/lifecycle/customer-lifecycle";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const expectedSecret = process.env.CRON_SECRET;
  const suppliedSecret = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || new URL(request.url).searchParams.get("secret");

  if (expectedSecret && suppliedSecret !== expectedSecret) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const result = await syncCustomerLifecycle(prisma, { limit: 500 });
  return NextResponse.json({ ok: true, ...result, ranAt: new Date().toISOString() });
}
