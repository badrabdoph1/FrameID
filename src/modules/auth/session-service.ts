import {
  buildSessionCookie,
  createRawSessionToken,
  getSessionExpiresAt,
  hashSessionToken,
  type SessionCookie
} from "@/modules/auth/session-tokens";

export type SessionRepository = {
  createSession(input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<{
    id: string;
    userId: string;
    expiresAt: Date;
  }>;
};

export type CreatedSession = {
  id: string;
  userId: string;
  expiresAt: Date;
  cookie: SessionCookie;
};

export async function createSessionForUser({
  repository,
  userId,
  now = () => new Date()
}: {
  repository: SessionRepository;
  userId: string;
  now?: () => Date;
}): Promise<CreatedSession> {
  const rawToken = createRawSessionToken();
  const tokenHash = hashSessionToken(rawToken);
  const expiresAt = getSessionExpiresAt(now());
  const session = await repository.createSession({
    userId,
    tokenHash,
    expiresAt
  });

  return {
    id: session.id,
    userId: session.userId,
    expiresAt: session.expiresAt,
    cookie: buildSessionCookie(rawToken, session.expiresAt)
  };
}
