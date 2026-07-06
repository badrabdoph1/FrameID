import { hashSessionToken } from "@/modules/auth/session-tokens";

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
