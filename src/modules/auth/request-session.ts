import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/modules/auth/current-session-service";
import { createPrismaCurrentSessionRepository } from "@/modules/auth/prisma-current-session-repository";
import { SESSION_COOKIE_NAME } from "@/modules/auth/session-tokens";

export async function getCurrentRequestSession() {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  return getCurrentSession({
    repository: createPrismaCurrentSessionRepository(prisma),
    rawToken,
    now: new Date()
  });
}
