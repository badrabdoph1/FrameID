import { createRawSessionToken, hashSessionToken } from "@/modules/auth/session-tokens";
import { hashPassword } from "@/modules/auth/password-hashing";

const RESET_TOKEN_TTL_MINUTES = 60;

export type PasswordResetRepository = {
  findUserByEmail(email: string): Promise<{ id: string; email: string } | null>;
  createResetToken(input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<void>;
  findValidTokenByHash(
    tokenHash: string,
    now: Date
  ): Promise<{ id: string; userId: string } | null>;
  updateUserPassword(input: {
    userId: string;
    passwordHash: string;
  }): Promise<void>;
  markTokenUsed(input: {
    tokenId: string;
    usedAt: Date;
  }): Promise<void>;
  revokeUserSessions(input: {
    userId: string;
    revokedAt: Date;
  }): Promise<void>;
};

export function createPasswordResetService({
  repository,
  createRawToken = createRawSessionToken,
  hashToken = hashSessionToken,
  now = () => new Date()
}: {
  repository: PasswordResetRepository;
  createRawToken?: () => string;
  hashToken?: (rawToken: string) => string;
  now?: () => Date;
}) {
  return {
    async requestPasswordReset(input: {
      email: string;
    }): Promise<{
      delivered: boolean;
      rawToken: string | null;
      userEmail: string | null;
    }> {
      const email = input.email.trim().toLowerCase();
      const user = await repository.findUserByEmail(email);

      if (!user) {
        return {
          delivered: false,
          rawToken: null,
          userEmail: null
        };
      }

      const rawToken = createRawToken();
      const expiresAt = new Date(now());
      expiresAt.setUTCMinutes(expiresAt.getUTCMinutes() + RESET_TOKEN_TTL_MINUTES);

      await repository.createResetToken({
        userId: user.id,
        tokenHash: hashToken(rawToken),
        expiresAt
      });

      return {
        delivered: true,
        rawToken,
        userEmail: user.email
      };
    },
    async resetPassword(input: {
      rawToken: string;
      newPassword: string;
    }): Promise<void> {
      if (input.newPassword.length < 10) {
        throw new Error("Password must be at least 10 characters");
      }

      const resetToken = await repository.findValidTokenByHash(
        hashToken(input.rawToken),
        now()
      );

      if (!resetToken) {
        throw new Error("Invalid or expired reset token");
      }

      const changedAt = now();
      const passwordHash = await hashPassword(input.newPassword);

      await repository.updateUserPassword({
        userId: resetToken.userId,
        passwordHash
      });
      await repository.markTokenUsed({
        tokenId: resetToken.id,
        usedAt: changedAt
      });
      await repository.revokeUserSessions({
        userId: resetToken.userId,
        revokedAt: changedAt
      });
    }
  };
}
