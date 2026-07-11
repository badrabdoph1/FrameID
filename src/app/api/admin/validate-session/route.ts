import { NextResponse } from "next/server";
import { hashAdminSessionToken, verifySignedAdminSessionToken } from "@/modules/admin/admin-session-tokens";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const rawToken = request.headers.get("x-admin-session-token");

  if (!rawToken) {
    return NextResponse.json({ valid: false }, { status: 401 });
  }

  const signedPayload = verifySignedAdminSessionToken(rawToken);
  if (signedPayload) {
    return NextResponse.json({ valid: true, mode: "stateless" });
  }

  const tokenHash = hashAdminSessionToken(rawToken);

  const session = await prisma.session.findFirst({
    where: {
      tokenHash,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: { id: true },
  });

  if (!session) {
    return NextResponse.json({ valid: false }, { status: 401 });
  }

  return NextResponse.json({ valid: true, mode: "database" });
}
