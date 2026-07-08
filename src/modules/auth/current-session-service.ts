import { hashSessionToken } from "@/modules/auth/session-tokens";
import { canAccessSuperAdmin } from "@/modules/admin/admin-rbac";

export type CurrentUserSession = {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
};

export type CurrentSession = {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  tenant: {
    id: string;
    displayName: string;
    status: "TRIAL" | "ACTIVE" | "EXPIRED" | "SUSPENDED";
    trialEndsAt: Date;
  };
  site: {
    id: string;
    slug: string;
    title: string;
    status: "DRAFT" | "PUBLISHED" | "EXPIRED" | "SUSPENDED";
    slugChangeUsed: boolean;
  };
  subscription: {
    id: string;
    planId: string | null;
    plan: { code: string; name: string; priceAmount: number; currency: string } | null;
    status: "TRIAL" | "ACTIVE" | "EXPIRED" | "PAST_DUE" | "CANCELLED" | "SUSPENDED";
    currentPeriodEnd: Date | null;
  } | null;
};

export type CurrentSessionRepository = {
  findActiveSessionByTokenHash(
    tokenHash: string,
    now: Date
  ): Promise<CurrentSession | null>;
};

export type CurrentUserSessionRepository = {
  findActiveUserByTokenHash(
    tokenHash: string,
    now: Date
  ): Promise<CurrentUserSession | null>;
};

export async function getCurrentSession({
  repository,
  rawToken,
  now
}: {
  repository: CurrentSessionRepository;
  rawToken: string | undefined;
  now: Date;
}): Promise<CurrentSession | null> {
  if (!rawToken) {
    return null;
  }

  return repository.findActiveSessionByTokenHash(hashSessionToken(rawToken), now);
}

export async function getCurrentUserSession({
  repository,
  rawToken,
  now
}: {
  repository: CurrentUserSessionRepository;
  rawToken: string | undefined;
  now: Date;
}): Promise<CurrentUserSession | null> {
  if (!rawToken) {
    return null;
  }

  return repository.findActiveUserByTokenHash(hashSessionToken(rawToken), now);
}

export function getPostLoginRedirectPath(role: string): "/admin" | "/dashboard" {
  return canAccessSuperAdmin(role) ? "/admin" : "/dashboard";
}
