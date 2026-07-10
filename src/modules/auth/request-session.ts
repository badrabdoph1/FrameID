import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import {
  getCurrentSession,
  getCurrentUserSession
} from "@/modules/auth/current-session-service";
import { createPrismaCurrentSessionRepository } from "@/modules/auth/prisma-current-session-repository";
import { SESSION_COOKIE_NAME } from "@/modules/auth/session-tokens";
import { syncCustomerLifecycle } from "@/modules/lifecycle/customer-lifecycle";

export async function getCurrentRequestSession() {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const now = new Date();
  const repository = createPrismaCurrentSessionRepository(prisma);

  const session = await getCurrentSession({ repository, rawToken, now });
  if (!session) return null;

  const synced = await syncCustomerLifecycle(prisma, { tenantId: session.tenant.id, now, limit: 1 });
  if (synced.expiredSubscriptions > 0 || synced.expiredTrials > 0) {
    return getCurrentSession({ repository, rawToken, now: new Date() });
  }

  return session;
}

export async function getCurrentRequestUserSession() {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  return getCurrentUserSession({
    repository: createPrismaCurrentSessionRepository(prisma),
    rawToken,
    now: new Date()
  });
}
