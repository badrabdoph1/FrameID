import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { processError } from "@/lib/errors";

const ALLOWED_TYPES = new Set(["success", "error", "warning", "info"]);

type NotificationEventPayload = {
  type?: string;
  title?: string;
  body?: string;
  category?: string;
  requestId?: string;
  correlationId?: string;
  route?: string;
  userId?: string;
  tenantId?: string;
};

function clean(value: unknown, max = 500): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, max);
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as NotificationEventPayload;
    const type = clean(payload.type, 30) ?? "info";

    if (!ALLOWED_TYPES.has(type)) {
      return NextResponse.json({ ok: false, error: "Invalid notification type" }, { status: 400 });
    }

    const title = clean(payload.title, 180);
    if (!title) {
      return NextResponse.json({ ok: false, error: "Missing notification title" }, { status: 400 });
    }

    const metadata: Prisma.InputJsonObject = {
      requestId: clean(payload.requestId, 80) ?? null,
      correlationId: clean(payload.correlationId, 80) ?? null,
      route: clean(payload.route, 500) ?? null,
    };

    await prisma.notificationLog.create({
      data: {
        type,
        title,
        body: clean(payload.body, 2000) ?? null,
        category: clean(payload.category, 80) ?? null,
        userId: clean(payload.userId, 80) ?? null,
        tenantId: clean(payload.tenantId, 80) ?? null,
        metadata,
      } as Prisma.NotificationLogUncheckedCreateInput,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    await processError(error, {
      metadata: { action: "notificationEventLog" },
    });

    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
