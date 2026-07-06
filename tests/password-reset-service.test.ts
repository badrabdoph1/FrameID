import { describe, expect, it } from "vitest";

import {
  createPasswordResetService,
  type PasswordResetRepository
} from "@/modules/auth/password-reset-service";

function createRepository(): PasswordResetRepository & { events: string[] } {
  const events: string[] = [];

  return {
    events,
    async findUserByEmail(email) {
      events.push(`find:${email}`);
      return email === "ali@example.com" ? { id: "user_1", email } : null;
    },
    async createResetToken(input) {
      events.push(`token:${input.userId}:${input.tokenHash}:${input.expiresAt.toISOString()}`);
    },
    async findValidTokenByHash(tokenHash, now) {
      events.push(`valid:${tokenHash}:${now.toISOString()}`);
      return tokenHash === "known-token-hash"
        ? { id: "reset_1", userId: "user_1" }
        : null;
    },
    async updateUserPassword(input) {
      events.push(`password:${input.userId}:${input.passwordHash.startsWith("scrypt$")}`);
    },
    async markTokenUsed(input) {
      events.push(`used:${input.tokenId}:${input.usedAt.toISOString()}`);
    },
    async revokeUserSessions(input) {
      events.push(`revoke:${input.userId}:${input.revokedAt.toISOString()}`);
    }
  };
}

describe("password reset service", () => {
  it("creates a hashed reset token for existing users without exposing the hash", async () => {
    const repository = createRepository();
    const service = createPasswordResetService({
      repository,
      createRawToken: () => "raw-token",
      hashToken: () => "hashed-token",
      now: () => new Date("2026-07-07T10:00:00.000Z")
    });

    await expect(
      service.requestPasswordReset({ email: "ALI@EXAMPLE.COM" })
    ).resolves.toEqual({
      delivered: true,
      rawToken: "raw-token",
      userEmail: "ali@example.com"
    });

    expect(repository.events).toEqual([
      "find:ali@example.com",
      "token:user_1:hashed-token:2026-07-07T11:00:00.000Z"
    ]);
  });

  it("returns a neutral result when the user does not exist", async () => {
    const repository = createRepository();
    const service = createPasswordResetService({ repository });

    await expect(
      service.requestPasswordReset({ email: "missing@example.com" })
    ).resolves.toEqual({
      delivered: false,
      rawToken: null,
      userEmail: null
    });

    expect(repository.events).toEqual(["find:missing@example.com"]);
  });

  it("resets the password, marks the token used and revokes sessions", async () => {
    const repository = createRepository();
    const service = createPasswordResetService({
      repository,
      hashToken: () => "known-token-hash",
      now: () => new Date("2026-07-07T10:00:00.000Z")
    });

    await service.resetPassword({
      rawToken: "raw-token",
      newPassword: "NewStrongPass123!"
    });

    expect(repository.events).toEqual([
      "valid:known-token-hash:2026-07-07T10:00:00.000Z",
      "password:user_1:true",
      "used:reset_1:2026-07-07T10:00:00.000Z",
      "revoke:user_1:2026-07-07T10:00:00.000Z"
    ]);
  });

  it("rejects expired or unknown reset tokens", async () => {
    const repository = createRepository();
    const service = createPasswordResetService({
      repository,
      hashToken: () => "missing-token-hash"
    });

    await expect(
      service.resetPassword({
        rawToken: "raw-token",
        newPassword: "NewStrongPass123!"
      })
    ).rejects.toThrow("Invalid or expired reset token");
  });
});
