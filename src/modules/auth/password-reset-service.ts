import { createRawSessionToken, hashSessionToken } from "@/modules/auth/session-tokens";
import { hashPassword } from "@/modules/auth/password-hashing";
import { resetPasswordInputSchema } from "@/modules/auth/reset-password-validation";
import { AppError } from "@/lib/errors";

const RESET_TOKEN_TTL_MINUTES = 60;

export type PasswordResetRepository = {
  findUserByEmail(email: string): Promise<{ id: string; email: string; name: string } | null>;
  createResetToken(input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<void>;
  findValidTokenByHash(
    tokenHash: string,
    now: Date
  ): Promise<{ id: string; userId: string; usedAt: Date | null; expiresAt: Date } | null>;
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
      userName: string | null;
    }> {
      const email = input.email.trim().toLowerCase();
      const user = await repository.findUserByEmail(email);

      if (!user) {
        return {
          delivered: false,
          rawToken: null,
          userEmail: null,
          userName: null,
        };
      }

      const rawToken = createRawToken();
      const expiresAt = new Date(now().getTime() + RESET_TOKEN_TTL_MINUTES * 60 * 1000);

      await repository.createResetToken({
        userId: user.id,
        tokenHash: hashToken(rawToken),
        expiresAt,
      });

      return {
        delivered: true,
        rawToken,
        userEmail: user.email,
        userName: user.name,
      };
    },
    async resetPassword(input: {
      rawToken: string;
      newPassword: string;
    }): Promise<void> {
      const parsed = resetPasswordInputSchema.parse({
        token: input.rawToken,
        password: input.newPassword,
      });

      const tokenHash = hashToken(parsed.token);
      const resetToken = await repository.findValidTokenByHash(tokenHash, now());

      if (!resetToken) {
        throw new AppError("FID-AUTH-006");
      }

      if (resetToken.usedAt) {
        throw new AppError("FID-AUTH-008");
      }

      if (resetToken.expiresAt < now()) {
        throw new AppError("FID-AUTH-006");
      }

      const changedAt = now();
      const passwordHash = await hashPassword(parsed.password);

      await repository.updateUserPassword({
        userId: resetToken.userId,
        passwordHash,
      });
      await repository.markTokenUsed({
        tokenId: resetToken.id,
        usedAt: changedAt,
      });
      await repository.revokeUserSessions({
        userId: resetToken.userId,
        revokedAt: changedAt,
      });
    }
  };
}
