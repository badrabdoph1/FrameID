import { NextResponse } from "next/server";

import { runCommunicationDeliveryBatch } from "@/modules/communication-delivery/runtime";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(request: Request): boolean {
  const expected = process.env.CRON_SECRET?.trim();
  if (!expected) return process.env.NODE_ENV !== "production";
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return supplied === expected;
}

async function handle(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const result = await runCommunicationDeliveryBatch();
  return NextResponse.json({ ok: true, ...result });
}

export const GET = handle;
export const POST = handle;
