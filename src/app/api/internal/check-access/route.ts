import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { checkSiteAccessBySlug, checkTenantAccessById } from "@/modules/subscription/subscription-access";
import { createPrismaCurrentSessionRepository } from "@/modules/auth/prisma-current-session-repository";
import { hashSessionToken } from "@/modules/auth/session-tokens";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");
  const token = request.nextUrl.searchParams.get("token");

  if (slug) {
    const { result } = await checkSiteAccessBySlug(slug);
    return NextResponse.json(result);
  }

  if (token) {
    const repository = createPrismaCurrentSessionRepository(prisma);
    const session = await repository.findActiveSessionByTokenHash(
      hashSessionToken(token),
      new Date()
    );

    if (!session) {
      return NextResponse.json({ allowed: true, reason: "NO_SESSION" }, { status: 200 });
    }

    const result = await checkTenantAccessById(session.tenant.id);
    return NextResponse.json(result);
  }

  return NextResponse.json({ allowed: true, reason: "NO_PARAM" }, { status: 200 });
}
