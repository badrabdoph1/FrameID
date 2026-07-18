import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { runCommunicationLegacyBackfill } from "@/modules/communication-center/backfill";
import { communicationLegacyBridge } from "@/modules/communication-center/runtime";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const expected = process.env.CRON_SECRET?.trim();
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if ((expected && supplied !== expected) || (!expected && process.env.NODE_ENV === "production")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  const result = await runCommunicationLegacyBackfill(prisma, communicationLegacyBridge, { limit: 200 });
  return NextResponse.json({ ok: true, ...result });
}
