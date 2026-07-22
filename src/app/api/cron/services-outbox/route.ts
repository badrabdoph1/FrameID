import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { runServicesOutboxBatch } from "@/modules/services-platform/outbox-runtime";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(request: Request) {
  const expected = process.env.CRON_SECRET?.trim();
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return expected ? supplied === expected : process.env.NODE_ENV !== "production";
}

async function handle(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  return NextResponse.json({ ok: true, ...(await runServicesOutboxBatch(prisma)) });
}

export const GET = handle;
export const POST = handle;
